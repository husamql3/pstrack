import fs from 'fs/promises'
import path from 'path'

import { SendApprovalEmail } from '@/types/sendEmail.type'
import { sendEmail } from '@/utils/email/sendEmail'
import { sendAdminEmail } from '@/utils/email/sendAdminEmail'

export const sendApproveEmail = async ({ to, username, group_no }: SendApprovalEmail) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'email', 'approveEmailTemplate.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')
    const groupLink = `https://pstrack.tech/g/${group_no}`

    htmlContent = htmlContent
      .replace(/{{username}}/g, username)
      .replace(/{{group_no}}/g, group_no)
      .replace(/{{group_link}}/g, groupLink)

    await sendEmail({
      to: to,
      subject: 'Congratulations - You’ve been accepted to PSTrack',
      html: htmlContent,
    })
  } catch (error) {
    await sendAdminEmail(error, 'sendApproveEmail')
  }
}
