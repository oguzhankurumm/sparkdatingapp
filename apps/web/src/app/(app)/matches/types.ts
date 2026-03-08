// ──────────────────────────────────────────────
// Match & Chat types for the matches feature
// ──────────────────────────────────────────────

export interface MatchPartner {
  id: string
  firstName: string
  avatarUrl: string | null
  isVerified: boolean
  lastActiveAt: string | null
}

export interface Match {
  id: string
  partner: MatchPartner
  matchedAt: string
  expiresAt: string
  lastMessageAt: string | null
  lastMessage: string | null
  unreadCount: number
  status: 'active' | 'expired'
}

export interface MatchesResponse {
  matches: Match[]
  newMatches: Match[]
}

export interface MatchDetail {
  id: string
  partner: MatchPartner
  matchedAt: string
  expiresAt: string
  compatibilityScore: number | null
}

export type MessageType = 'text' | 'image' | 'gift' | 'voice' | 'system'

export interface Message {
  id: string
  matchId: string
  senderId: string
  type: MessageType
  content: string
  createdAt: string
  readAt: string | null
}

export interface MessagesResponse {
  messages: Message[]
  nextCursor: string | null
}

export interface SendMessagePayload {
  type: MessageType
  content: string
}

// Socket event types
export interface SocketMessageEvent {
  matchId: string
  message: Message
}

export interface SocketTypingEvent {
  matchId: string
  userId: string
}

export interface SocketReadEvent {
  matchId: string
  messageIds: string[]
  readAt: string
}
