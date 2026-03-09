import { baseTemplate } from './base.template'

export interface WelcomeEmailData {
  name: string
  bonusTokens: number
}

export function welcomeEmail(data: WelcomeEmailData): { subject: string; html: string } {
  const content = `
    <h2>Welcome to Spark, ${data.name}! 🎉</h2>
    <p>Your account is all set up and ready to go. We've added <strong>${data.bonusTokens} tokens</strong> to your wallet as a welcome bonus.</p>
    <p>Here's how to get the most out of Spark:</p>
    <ul style="padding-left: 20px; margin: 0 0 16px;">
      <li style="margin-bottom: 8px;">Complete your profile to get discovered</li>
      <li style="margin-bottom: 8px;">Swipe to find your match</li>
      <li style="margin-bottom: 8px;">Start a conversation and connect</li>
    </ul>
    <p style="text-align: center;">
      <a href="https://spark.app/discover" class="cta">Start Discovering</a>
    </p>
    <p class="muted">Need help? Reply to this email or visit our <a href="https://spark.app/help">Help Center</a>.</p>
  `

  return {
    subject: `Welcome to Spark, ${data.name}!`,
    html: baseTemplate(content, `You've received ${data.bonusTokens} tokens as a welcome bonus.`),
  }
}
