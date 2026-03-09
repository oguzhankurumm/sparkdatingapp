/**
 * Base HTML email template with Spark branding.
 * All transactional emails wrap their content in this layout.
 */

const BRAND = {
  name: 'Spark',
  logo: 'https://cdn.spark.app/logo-email.png',
  primaryColor: '#E11D48',
  gradientStart: '#E11D48',
  gradientEnd: '#9333EA',
  bgColor: '#FAFAF9',
  textColor: '#1C1917',
  mutedColor: '#78716C',
  footerColor: '#A8A29E',
}

export function baseTemplate(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${BRAND.name}</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:${BRAND.bgColor};max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body { margin: 0; padding: 0; background-color: ${BRAND.bgColor}; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif; }
    .wrapper { width: 100%; background-color: ${BRAND.bgColor}; padding: 40px 0; }
    .container { max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); padding: 32px 40px; text-align: center; }
    .header h1 { color: #FFFFFF; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.02em; }
    .body { padding: 32px 40px; color: ${BRAND.textColor}; font-size: 15px; line-height: 1.6; }
    .body h2 { font-size: 20px; font-weight: 700; margin: 0 0 16px; color: ${BRAND.textColor}; }
    .body p { margin: 0 0 16px; }
    .body a { color: ${BRAND.primaryColor}; text-decoration: none; }
    .cta { display: inline-block; background: linear-gradient(135deg, ${BRAND.gradientStart}, ${BRAND.gradientEnd}); color: #FFFFFF !important; font-size: 15px; font-weight: 600; padding: 12px 32px; border-radius: 12px; text-decoration: none; margin: 8px 0; }
    .muted { color: ${BRAND.mutedColor}; font-size: 13px; }
    .footer { padding: 24px 40px; text-align: center; color: ${BRAND.footerColor}; font-size: 12px; line-height: 1.5; border-top: 1px solid #F5F5F4; }
    .footer a { color: ${BRAND.footerColor}; text-decoration: underline; }
    @media (max-width: 600px) {
      .container { margin: 0 16px; }
      .header, .body, .footer { padding-left: 24px; padding-right: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${BRAND.name}</h1>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
        <p>
          <a href="https://spark.app/settings/notifications">Email preferences</a> &middot;
          <a href="https://spark.app/privacy">Privacy</a> &middot;
          <a href="https://spark.app/terms">Terms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}
