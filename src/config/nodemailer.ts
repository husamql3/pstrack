import 'dotenv/config'
import nodemailer from 'nodemailer'

import { env } from './env.mjs'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: true,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASSWORD,
  },
  pool: true,
  maxConnections: 5,
  maxMessages: Number.POSITIVE_INFINITY,
  rateLimit: 10,
  rateDelta: 1000,
})
