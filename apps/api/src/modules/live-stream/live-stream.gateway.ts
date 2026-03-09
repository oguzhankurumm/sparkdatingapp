import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import type { JwtService } from '@nestjs/jwt'
import type { Server, Socket } from 'socket.io'
import * as Sentry from '@sentry/node'
import type { LiveStreamService } from './live-stream.service'

interface AuthenticatedSocket extends Socket {
  data: { userId: string }
}

@WebSocketGateway({ namespace: '/stream' })
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(LiveStreamGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly liveStreamService: LiveStreamService,
  ) {}

  // ── Connection ──────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        (client.handshake.query?.token as string | undefined)

      if (!token) {
        client.disconnect()
        return
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET')
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret })

      if (!payload?.sub) {
        client.disconnect()
        return
      }

      client.data.userId = payload.sub
      this.logger.debug(`Stream socket connected: ${client.id} (user ${payload.sub})`)
    } catch {
      client.disconnect()
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    this.logger.debug(`Stream socket disconnected: ${client.id}`)
  }

  // ── Client Events ──────────────────────────────────────────

  @SubscribeMessage('stream:join')
  async handleJoinStream(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { streamId: string },
  ): Promise<void> {
    try {
      const roomName = `stream:${data.streamId}`
      await client.join(roomName)

      // Broadcast to other viewers in the room
      client.to(roomName).emit('stream:viewer_joined', {
        userId: client.data.userId,
      })

      this.logger.debug(`User ${client.data.userId} joined stream room ${data.streamId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to join stream room ${data.streamId}`, error)
    }
  }

  @SubscribeMessage('stream:leave')
  async handleLeaveStream(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { streamId: string },
  ): Promise<void> {
    try {
      const roomName = `stream:${data.streamId}`

      // Mark viewer as left in DB
      await this.liveStreamService.leaveStream(data.streamId, client.data.userId)

      client.to(roomName).emit('stream:viewer_left', {
        userId: client.data.userId,
      })

      await client.leave(roomName)
      this.logger.debug(`User ${client.data.userId} left stream room ${data.streamId}`)
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to leave stream room ${data.streamId}`, error)
    }
  }

  @SubscribeMessage('stream:chat')
  async handleStreamChat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { streamId: string; message: string },
  ): Promise<void> {
    try {
      const roomName = `stream:${data.streamId}`

      // Broadcast chat message to all viewers (including sender for confirmation)
      this.server.to(roomName).emit('stream:chat_message', {
        userId: client.data.userId,
        message: data.message,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      Sentry.captureException(error)
      this.logger.error(`Failed to send stream chat in ${data.streamId}`, error)
    }
  }

  // ── Server-Side Emitters (called by services) ──────────────

  /** Notify all viewers that a gift was sent */
  emitGiftReceived(
    streamId: string,
    payload: {
      senderId: string
      senderName: string
      giftName: string
      giftImageUrl: string
      tokenValue: number
    },
  ): void {
    this.server.to(`stream:${streamId}`).emit('stream:gift_received', payload)
  }

  /** Notify all viewers that the stream has ended */
  emitStreamEnded(streamId: string): void {
    this.server.to(`stream:${streamId}`).emit('stream:ended', { streamId })
  }

  /** Broadcast updated viewer count */
  emitViewerCountUpdate(streamId: string, viewerCount: number): void {
    this.server.to(`stream:${streamId}`).emit('stream:viewer_count', { viewerCount })
  }
}
