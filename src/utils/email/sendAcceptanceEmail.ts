import path from 'node:path'
import fs from 'node:fs/promises'

import { sendEmail } from './sendEmail'

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
    htmlContent = htmlContent.replace(/{{group_no}}/g, group_no.toString()).replace(/{{username}}/g, username)

    await sendEmail({
      to: email,
      subject: 'Congratulations 🎉 - You’ve been accepted to PSTrack',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending acceptance email:', error)
  }
}
