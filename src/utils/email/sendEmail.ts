import path from 'node:path'
import fs from 'node:fs/promises'

import { env } from '@/config/env.mjs'
import { transporter } from '@/config/nodemailer'

export const adminEmail = env.ADMIN_EMAIL

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

export const sendAcceptanceEmail = async ({
  group_no,
  email,
  username,
}: {
  group_no: number
  email: string
  username: string
}) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'acceptance-email.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')
    htmlContent = htmlContent
      .replace(/{{group_no}}/g, group_no.toString())
      .replace(/{{username}}/g, username)

    await sendEmail({
      to: email,
      subject: 'Congratulations 🎉 - You’ve been accepted to PSTrack',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending acceptance email:', error)
  }
}

export const sendAdminNotification = async (context: Record<string, string>) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'admin-email.html')
    let htmlContent = await fs.readFile(templatePath, 'utf-8')

    const contextJson = JSON.stringify(context, null, 2)
    htmlContent = htmlContent.replace(/{{context}}/g, contextJson)

    await sendEmail({
      to: adminEmail,
      subject: 'PSTrack Admin Notification',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending admin email:', error)
  }
}
