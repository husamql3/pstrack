import fs from 'fs'
import path from 'path'
import { Resend } from 'resend'

import { SendRemiderEmail } from '@/types/sendEmail.type'

export const sendSolveProblemsRemider = async ({ to, group_no }: SendRemiderEmail) => {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const projectRoot = process.cwd()
  const templatePath = path.join(projectRoot, 'public', 'approveEmailTemplate.html')

  let htmlContent = await fs.promises.readFile(templatePath, 'utf-8')
  const groupLink = `https://pstrack.tech/g/${group_no}`

  htmlContent = htmlContent.replace(/{{group_link}}/g, groupLink)

  return await resend.emails.send({
    from: 'info@pstrack.tech',
    to,
    subject: '1 Day Left: Solve Problems to Stay in PSTrack!',
    html: htmlContent,
  })
}
