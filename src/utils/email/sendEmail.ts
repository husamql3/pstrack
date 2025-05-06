import { env } from '@/config/env.mjs'
import { transporter } from '@/config/nodemailer'

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    })
    console.log('To:', to)
    return info
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error sending email to', to, ':', error.stack)
    } else {
      console.error('Error sending email to', to, ':', String(error))
    }
  }
}
