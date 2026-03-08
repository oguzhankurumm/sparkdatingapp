import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import type { ConfigService } from '@nestjs/config'
import type { Server, Socket } from 'socket.io'

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string
  }
}

/**
 * WebSocket gateway for real-time notification delivery.
 *
 * Each authenticated user joins a personal room `user:<userId>`.
 * The NotificationsService calls `emitToUser()` to push notifications
 * in real-time to connected clients.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(NotificationsGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Authenticate and auto-join the user's personal room.
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth as Record<string, string>)?.token ??
        (client.handshake.query?.token as string | undefined)

      if (!token) {
        this.logger.warn('Notification WS rejected: no token')
        client.disconnect()
        return
      }

      const secret = this.configService.getOrThrow<string>('JWT_SECRET')
      const payload = this.jwtService.verify<{ sub: string }>(token, { secret })

      if (!payload.sub) {
        this.logger.warn('Notification WS rejected: invalid payload')
        client.disconnect()
        return
      }

      client.data.userId = payload.sub

      // Auto-join the user's personal notification room
      const room = `user:${payload.sub}`
      await client.join(room)

      this.logger.log(`Notification WS connected: user ${payload.sub} (socket ${client.id})`)
    } catch (error) {
      this.logger.warn(
        `Notification WS rejected: ${error instanceof Error ? error.message : 'unknown error'}`,
      )
      client.disconnect()
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.logger.log(`Notification WS disconnected: socket ${client.id}`)
  }

  /**
   * Emit a notification to a specific user via their personal room.
   * Called by NotificationsService after persisting to DB.
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
