import { baseTemplate } from './base.template'

export interface MatchNotificationData {
  recipientName: string
  matchName: string
  matchAge: number
  expiresInHours: number
}

export function matchNotificationEmail(data: MatchNotificationData): {
  subject: string
  html: string
} {
  const content = `
    <h2>You have a new match!</h2>
    <p>Hey ${data.recipientName}, great news — <strong>${data.matchName}, ${data.matchAge}</strong> matched with you!</p>
    <p>You have <strong>${data.expiresInHours} hours</strong> to start a conversation before this match expires. Don't miss your chance!</p>
    <p style="text-align: center;">
      <a href="https://spark.app/matches" class="cta">Say Hello</a>
    </p>
    <p class="muted">Matches expire after 72 hours without a message.</p>
  `

  return {
    subject: `${data.matchName} matched with you on Spark!`,
    html: baseTemplate(
      content,
      `${data.matchName} matched with you — say hello before time runs out!`,
    ),
  }
}
