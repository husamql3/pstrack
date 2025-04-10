import 'dotenv/config'
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: true,
  auth: {
    user: process.env.TITAN_EMAIL_USER,
    pass: process.env.TITAN_EMAIL_PASSWORD,
  },
})
