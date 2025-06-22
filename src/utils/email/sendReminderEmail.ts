import fs from 'node:fs/promises'
import path from 'node:path'

import { sendEmail } from './sendEmail'

export const sendReminderEmail = async ({ group_no, email }: { group_no: string; email: string }) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'leetcoder-reminder.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')
    htmlContent = htmlContent.replace(/{{group_no}}/g, group_no.toString())

    await sendEmail({
      to: email,
      subject: '🚨 Last Chance: Solve a Problem Today to Stay in Group',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending acceptance email:', error)
  }
}
