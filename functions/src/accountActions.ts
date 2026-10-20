import { admin } from './firebase'
import { config } from './config'
import { emailTemplate } from './emailHelpers'
import { sendEmail } from './mailer'

export type DeactivationReason = 'self' | 'security_flag'

export async function deactivateAccountCore(uid: string, reason: DeactivationReason) {
  const userRef = admin.firestore().doc(`users/${uid}`)
  const userSnap = await userRef.get()
  const email = userSnap.data()?.email

  await userRef.update({
    status: 'deactivated',
    deactivatedAt: Date.now(),
    deactivationReason: reason,
  })

  if (!email) return

  const subject = reason === 'security_flag'
    ? 'Your Study Buddy account has been paused for a security review'
    : 'Your Study Buddy account has been deactivated'

  const body = reason === 'security_flag'
    ? `
      <p style="font-size:16px; margin-bottom:8px;">Account paused ⚠️</p>
      <p style="font-size:15px; line-height:1.6; color:#444;">
        A security scan flagged a file uploaded to your <strong style="color:#195791;">Study Buddy</strong> account as potentially unsafe. As a precaution, your account has been temporarily paused while this is reviewed.
      </p>
      <p style="font-size:15px; line-height:1.6; color:#444;">
        If you believe this was a mistake, please contact <a href="mailto:${config.supportEmail}" style="color:#195791;">${config.supportEmail}</a>.
      </p>
    `
    : `
      <p style="font-size:16px; margin-bottom:8px;">We're sorry to see you go 😔</p>
      <p style="font-size:15px; line-height:1.6; color:#444;">
        Your account has been deactivated. Simply log back in within <strong>30 days</strong> to reactivate — after that, your account and data will be permanently deleted.
      </p>
    `

  await sendEmail({ to: email, subject, html: emailTemplate(body) })
}
