import { Resend } from 'resend'
import { config } from './config'

let client: Resend | null = null

/**
 * Sends an email through Resend. Resend's SDK returns { error } instead of
 * throwing when the API rejects a request, so we turn that into a real
 * exception - callers can then handle (or report) failures properly.
 */
export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<void> {
  if (!client) client = new Resend(config.resendApiKey)
  const { error } = await client.emails.send({
    from: config.emailFrom,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
  if (error) throw new Error(`Failed to send email: ${error.message}`)
}
