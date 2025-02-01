import path from 'path'
import fs from 'fs/promises'

import { SendDailyProblemEmail } from '@/types/sendEmail.type'
import { sendEmail } from '@/utils/email/sendEmail'
import { sendAdminEmail } from '@/utils/email/sendAdminEmail'

export const sendDailyProblemEmail = async ({
  problem_slug,
  difficulty,
  topic,
  group_no,
  email,
}: SendDailyProblemEmail) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'email', 'dailyProblemEmailTemplate.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')
    const groupLink = `https://pstrack.tech/g/${group_no}`

    htmlContent = htmlContent
      .replace(/{{problem_slug}}/g, problem_slug)
      .replace(/{{difficulty}}/g, difficulty)
      .replace(/{{topic}}/g, topic)
      .replace(/{{group_link}}/g, groupLink)

    await sendEmail({
      to: email,
      subject: "Todays's LeetCode Problem: Can You Solve It?",
      html: htmlContent,
    })
  } catch (error) {
    await sendAdminEmail(error, 'sendDailyProblemEmail')
  }
}
