import path from 'node:path'
import fs from 'node:fs/promises'

import { sendEmail } from '@/utils/email/sendEmail'
import { AUTHOR_EMAIL } from '@/data/constants'

export const sendAdminNotification = async (context: Record<string, string>) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'admin-email.html')
    let htmlContent = await fs.readFile(templatePath, 'utf-8')

    const contextJson = JSON.stringify(context, null, 2)
    htmlContent = htmlContent.replace(/{{context}}/g, contextJson)

    await sendEmail({
      to: AUTHOR_EMAIL,
      subject: 'PSTrack Admin Notification',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending admin email:', error)
  }
}
