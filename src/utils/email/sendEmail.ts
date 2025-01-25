import nodemailer from 'nodemailer'

import { SendEmailType } from '@/types/sendEmail.type'

const titanEmail = process.env.TITAN_EMAIL_USER as string
const titanPassword = process.env.TITAN_EMAIL_PASSWORD as string

const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: titanEmail,
    pass: titanPassword,
  },
})

export const sendEmail = async ({ to, subject, html }: SendEmailType) => {
  const mailOptions = {
    from: titanEmail,
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
