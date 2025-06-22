import fs from 'node:fs/promises'
import path from 'node:path'

import { sendEmail } from './sendEmail'

export const sendRequestReceivedEmail = async ({ email }: { email: string }) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'request-received.html')

    const htmlContent = await fs.readFile(templatePath, 'utf-8')

    await sendEmail({
      to: email,
      subject: 'Request Received 🎉',
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending acceptance email:', error)
  }
}
