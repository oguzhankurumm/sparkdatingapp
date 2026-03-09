import { baseTemplate } from './base.template'

export interface ReferralInviteData {
  inviterName: string
  referralCode: string
  inviteeBonus: number
}

export function referralInviteEmail(data: ReferralInviteData): { subject: string; html: string } {
  const content = `
    <h2>${data.inviterName} invited you to Spark</h2>
    <p>Your friend <strong>${data.inviterName}</strong> thinks you'd love Spark — and they're giving you <strong>${data.inviteeBonus} free tokens</strong> to get started.</p>
    <p style="text-align: center; margin: 24px 0;">
      <span style="display: inline-block; background: #F5F5F4; padding: 12px 24px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: 700; letter-spacing: 0.05em; color: #1C1917;">
        ${data.referralCode}
      </span>
    </p>
    <p>Use this code when you sign up and you'll both earn bonus tokens.</p>
    <p style="text-align: center;">
      <a href="https://spark.app/register?ref=${data.referralCode}" class="cta">Join Spark</a>
    </p>
    <p class="muted">This referral code can be used once. Tokens are credited after sign-up.</p>
  `

  return {
    subject: `${data.inviterName} invited you to Spark — get ${data.inviteeBonus} free tokens`,
    html: baseTemplate(
      content,
      `${data.inviterName} is sharing ${data.inviteeBonus} tokens with you on Spark.`,
    ),
  }
}
