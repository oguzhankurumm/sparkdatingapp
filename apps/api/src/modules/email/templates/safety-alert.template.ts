import { baseTemplate } from './base.template'

export interface SafetyAlertData {
  userId: string
  userName: string
  alertType: 'panic' | 'report' | 'moderation'
  details: string
  timestamp: string
}

export function safetyAlertEmail(data: SafetyAlertData): { subject: string; html: string } {
  const labels: Record<string, string> = {
    panic: 'PANIC BUTTON TRIGGERED',
    report: 'USER REPORT',
    moderation: 'MODERATION FLAG',
  }

  const content = `
    <h2 style="color: #DC2626;">Safety Alert: ${labels[data.alertType] ?? data.alertType.toUpperCase()}</h2>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; color: #78716C; width: 120px;">User</td>
        <td style="padding: 8px 0; font-weight: 600;">${data.userName} (${data.userId})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #78716C;">Type</td>
        <td style="padding: 8px 0; font-weight: 600;">${labels[data.alertType] ?? data.alertType}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #78716C;">Time</td>
        <td style="padding: 8px 0;">${data.timestamp}</td>
      </tr>
    </table>
    <p><strong>Details:</strong></p>
    <p style="background: #FEF2F2; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #DC2626;">${data.details}</p>
    <p style="text-align: center;">
      <a href="https://admin.spark.app/moderation/users/${data.userId}" class="cta" style="background: #DC2626;">Review in Admin</a>
    </p>
  `

  return {
    subject: `[SPARK SAFETY] ${labels[data.alertType] ?? data.alertType} — ${data.userName}`,
    html: baseTemplate(content),
  }
}
