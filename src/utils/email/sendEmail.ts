import { SendEmailType } from '@/types/sendEmail.type'
import { transporter } from '@/config/nodemailer'

export const sendEmail = async ({ to, subject, html }: SendEmailType) => {
  const mailOptions = {
    from: process.env.TITAN_EMAIL_USER,
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
    throw error
  }
}
