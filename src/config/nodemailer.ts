import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email',
  port: 465,
  secure: true,
  auth: {
    user: process.env.TITAN_EMAIL_USER,
    pass: process.env.TITAN_EMAIL_PASSWORD,
  },
})
