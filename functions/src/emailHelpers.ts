import { config } from './config'

/**
 * Wraps content in the Study Buddy email layout.
 * showIgnoreNotice: adds the "if you didn't request this, ignore it" box.
 * Turn it off for emails where ignoring would be wrong (e.g. deletion warnings).
 */
export function emailTemplate(content: string, opts: { showIgnoreNotice?: boolean } = {}) {
  const showIgnoreNotice = opts.showIgnoreNotice ?? true
  const site = config.frontendUrl
  const siteLabel = site.replace(/^https?:\/\//, '')
  const support = config.supportEmail

  const ignoreNotice = showIgnoreNotice
    ? `
          <hr style="border:none; border-top:1px solid #EFF3FB; margin:28px 0;" />
          <div style="background-color:#EFF3FB; border-left:4px solid #195791; border-radius:0 4px 4px 0; padding:11px 14px; margin-bottom:18px;">
            <p style="font-size:12px; color:#555; margin:0;">🔒 If you didn't request this, you can safely ignore this email. Your account will remain unchanged.</p>
          </div>`
    : ''

  return `
    <body style="font-family:sans-serif; color:#333; margin:0; padding:30px; background-color:#EFF3FB;">
      <div style="max-width:600px; margin:auto; background-color:#ffffff; border-radius:12px; overflow:hidden; border:0.5px solid #c8d8ec;">
        <div style="background-color:#ffffff; padding:24px 30px; text-align:center; border-bottom:3px solid #195791;">
          <img src="${site}/logo.png" alt="Study Buddy" style="width:160px;" />
        </div>
        <div style="padding:28px 32px;">
          ${content}${ignoreNotice}
          <p style="font-size:12px; color:#999; margin-top:20px;">
            Need help? <a href="mailto:${support}" style="color:#195791;">${support}</a>
          </p>
        </div>
        <div style="background-color:#EFF3FB; text-align:center; padding:18px 30px;">
          <p style="font-size:13px; color:#195791; font-weight:500; margin:0 0 3px;">Study Buddy</p>
          <p style="font-size:11px; color:#999; margin:0;">Supporting your learning journey · <a href="${site}" style="color:#195791;">${siteLabel}</a></p>
        </div>
      </div>
    </body>
  `
}

export function actionButton(link: string, label: string) {
  return `
    <div style="text-align:center; margin:32px 0;">
      <a href="${link}" style="background:linear-gradient(135deg,#195791,#2e7fc1); color:#ffffff; padding:13px 32px; text-decoration:none; border-radius:8px; display:inline-block; font-weight:bold; font-size:15px;">
        ${label}
      </a>
    </div>
    <p style="font-size:12px; color:#888;">If the button doesn't work, copy and paste this link:</p>
    <p style="font-size:11px; word-break:break-all;">
      <a href="${link}" style="color:#195791;">${link}</a>
    </p>
  `
}
