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

export type MessageType = 'text' | 'image' | 'gif' | 'gift' | 'voice' | 'system'

export interface GifMetadata {
  giphyId: string
  giphyUrl: string
  giphyPreview: string
  width: number
  height: number
}

export interface MessageMetadata {
  gif?: GifMetadata
}

export interface Message {
  id: string
  matchId: string
  senderId: string
  type: MessageType
  content: string
  translatedContent?: string | null
  originalLanguage?: string | null
  mediaUrl?: string | null
  metadata?: MessageMetadata | null
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
  metadata?: MessageMetadata
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
