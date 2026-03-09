import { baseTemplate } from './base.template'

export interface MatchExpiryWarningData {
  recipientName: string
  matchName: string
  hoursRemaining: number
}

export function matchExpiryWarningEmail(data: MatchExpiryWarningData): {
  subject: string
  html: string
} {
  const content = `
    <h2>Your match is about to expire</h2>
    <p>Hey ${data.recipientName}, your match with <strong>${data.matchName}</strong> expires in <strong>${data.hoursRemaining} hours</strong>.</p>
    <p>Send a message now to keep the conversation going — or you'll need to use tokens to rematch later.</p>
    <p style="text-align: center;">
      <a href="https://spark.app/matches" class="cta">Send a Message</a>
    </p>
    <p class="muted">You can always rematch for 50 tokens after expiry.</p>
  `

  return {
    subject: `Your match with ${data.matchName} expires soon`,
    html: baseTemplate(
      content,
      `${data.hoursRemaining}h left — send a message before your match expires.`,
    ),
  }
}
