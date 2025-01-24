import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'

import { SendEmail } from '@/types/sendEmail.type'
import { sendErrorEmailToAdmin } from '@/utils/email/sendErrorEmailToAdmin'

export const sendApproveEmail = async ({ to, username, group_no }: SendEmail) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'approveEmailTemplate.html')

    let htmlContent = await fs.promises.readFile(templatePath, 'utf-8')
    const groupLink = `https://pstrack.tech/g/${group_no}`

    htmlContent = htmlContent
      .replace(/{{username}}/g, username)
      .replace(/{{group_no}}/g, group_no)
      .replace(/{{group_link}}/g, groupLink)

    return await resend.emails.send({
      from: 'info@pstrack.tech',
      to,
      subject: 'Congratulations - You’ve been accepted to PSTrack',
      html: htmlContent,
    })
  } catch (error) {
    await sendErrorEmailToAdmin(error, 'sendApproveEmail')
  }
}
