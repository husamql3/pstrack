import fs from 'fs/promises'
import path from 'path'

import { sendEmail } from '@/utils/email/sendEmail'

export const sendAdminEmail = async (error: unknown, context: string): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL as string

    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'email', 'adminEmailTemplate.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available'

    htmlContent = htmlContent
      .replace(/{{context}}/g, context)
      .replace(/{{errorMessage}}/g, errorMessage)
      .replace(/{{errorStack}}/g, errorStack || 'No stack trace available')

    await sendEmail({
      to: adminEmail,
      subject: 'PSTrack Admin Notification',
      html: htmlContent,
    })
  } catch (emailError) {
    console.error('Failed to send error email to admin:', emailError)
  }
}
