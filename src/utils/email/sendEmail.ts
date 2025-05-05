import { env } from '@/config/env.mjs'
import { transporter } from '@/config/nodemailer'

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const mailOptions = {
    from: env.EMAIL_USER,
    to: to,
    subject: subject,
    text: 'PSTrack 🔥',
    pool: true,
    html: html,
    maxConnections: 20,
    maxMessages: Number.POSITIVE_INFINITY,
    rateDelta: 1000,
    rateLimit: 100,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent to:', to)
    return info
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending email to', to, ':', error.stack)
    } else {
      console.error('Error sending email to', to, ':', String(error))
    }
  }
}
