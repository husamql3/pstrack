import { env } from '@/config/env.mjs'
import { transporter } from '@/config/nodemailer'

export const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) => {
  const mailOptions = {
    from: env.EMAIL_USER,
    to: to,
    subject: subject,
    text: 'PSTrack 🔥',
    html: html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.response)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
