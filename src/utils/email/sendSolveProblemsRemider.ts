import fs from 'fs/promises'
import path from 'path'

import { SendRemiderEmail } from '@/types/sendEmail.type'
import { sendEmail } from '@/utils/email/sendEmail'

export const sendSolveProblemsRemider = async ({ to, group_no }: SendRemiderEmail) => {
  const projectRoot = process.cwd()
  const templatePath = path.join(projectRoot, 'public', 'email', 'solveProblemsReminder.html')

  let htmlContent = await fs.readFile(templatePath, 'utf-8')
  const groupLink = `https://pstrack.tech/g/${group_no}`

  htmlContent = htmlContent.replace(/{{group_link}}/g, groupLink)

  await sendEmail({
    to,
    subject: '1 Day Left: Solve Problems to Stay in PSTrack!',
    html: htmlContent,
  })
}
