import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import type { ConfigService } from '@nestjs/config'
import * as Sentry from '@sentry/node'
import type { Server, Socket } from 'socket.io'
import type { MessagingService } from './messaging.service'
import type { MatchingService } from '../matching/matching.service'
import { sendMessageSchema } from './dto'

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string
  }
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(MessagingGateway.name)

  constructor(
    private readonly messagingService: MessagingService,
    private readonly matchingService: MatchingService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate WebSocket connections via JWT token.
   * Token can be passed in handshake.auth.token or handshake.query.token.
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        (client.handshake.query?.token as string | undefined)

      if (!token) {
        this.logger.warn('WebSocket connection rejected: no token')
        client.disconnect()
        return
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET')
      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret,
      })

      if (!payload.sub) {
        this.logger.warn('WebSocket connection rejected: invalid payload')
        client.disconnect()
        return
      }

      // Store userId on the socket for use in event handlers
      client.data.userId = payload.sub

      this.logger.log(`WebSocket connected: user ${payload.sub} (socket ${client.id})`)
    } catch (error) {
      this.logger.warn(
        `WebSocket connection rejected: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      client.disconnect()
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`WebSocket disconnected: socket ${client.id}`)
  }

  /**
   * Client joins a match room to receive real-time messages.
   * Validates the user is part of the match.
   */
  @SubscribeMessage('join:match')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ): Promise<{ event: string; data: { success: boolean; matchId: string } }> {
    try {
      const userId = client.data.userId

      // Verify user is part of the match
      await this.matchingService.verifyMatchAccess(data.matchId, userId)

      const roomName = `match:${data.matchId}`
      await client.join(roomName)

      this.logger.log(`User ${userId} joined room ${roomName}`)

      return {
        event: 'join:match',
        data: { success: true, matchId: data.matchId },
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to join match room', error)
      return {
        event: 'join:match',
        data: { success: false, matchId: data.matchId },
      }
    }
  }

  /**
   * Client leaves a match room.
   */
  @SubscribeMessage('leave:match')
  async handleLeaveMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ): Promise<{ event: string; data: { success: boolean; matchId: string } }> {
    try {
      const roomName = `match:${data.matchId}`
      await client.leave(roomName)

      this.logger.log(`User ${client.data.userId} left room ${roomName}`)

      return {
        event: 'leave:match',
        data: { success: true, matchId: data.matchId },
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to leave match room', error)
      return {
        event: 'leave:match',
        data: { success: false, matchId: data.matchId },
      }
    }
  }

  /**
   * Client sends a message.
   * Saves to DB, then broadcasts `message:new` to the match room.
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { matchId: string; type?: string; content?: string; mediaUrl?: string },
  ): Promise<{ event: string; data: { success: boolean; error?: string } }> {
    try {
      const userId = client.data.userId

      // Validate message payload
      const parsed = sendMessageSchema.safeParse({
        type: data.type ?? 'text',
        content: data.content,
        mediaUrl: data.mediaUrl,
      })

      if (!parsed.success) {
        return {
          event: 'message:send',
          data: {
            success: false,
            error: 'Invalid message payload',
          },
        }
      }

      // Save message to DB
      const message = await this.messagingService.sendMessage(data.matchId, userId, parsed.data)

      // Broadcast to the match room
      const roomName = `match:${data.matchId}`
      this.server.to(roomName).emit('message:new', {
        matchId: data.matchId,
        message,
      })

      return {
        event: 'message:send',
        data: { success: true },
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to send message via WebSocket', error)
      return {
        event: 'message:send',
        data: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  /**
   * Client marks messages as read.
   * Updates DB, then broadcasts `message:read` to the match room.
   */
  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ): Promise<{ event: string; data: { success: boolean } }> {
    try {
      const userId = client.data.userId

      const result = await this.messagingService.markAsRead(data.matchId, userId)

      // Broadcast read receipt to the match room
      const roomName = `match:${data.matchId}`
      this.server.to(roomName).emit('message:read', {
        matchId: data.matchId,
        readBy: userId,
        markedCount: result.markedCount,
      })

      return {
        event: 'message:read',
        data: { success: true },
      }
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error('Failed to mark messages as read via WebSocket', error)
      return {
        event: 'message:read',
        data: { success: false },
      }
    }
  }

  /**
   * Client starts typing in a match.
   * Broadcasts `typing:start` to the match room (excludes sender).
   */
  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ): void {
    const roomName = `match:${data.matchId}`
    client.to(roomName).emit('typing:start', {
      matchId: data.matchId,
      userId: client.data.userId,
    })
  }

  /**
   * Client stops typing in a match.
   * Broadcasts `typing:stop` to the match room (excludes sender).
   */
  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ): void {
    const roomName = `match:${data.matchId}`
    client.to(roomName).emit('typing:stop', {
      matchId: data.matchId,
      userId: client.data.userId,
    })
  }
}
