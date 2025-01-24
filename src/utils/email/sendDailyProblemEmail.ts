import { Resend } from 'resend'
import path from 'path'
import fs from 'fs'

import { SendDailyProblemEmail } from '@/types/sendEmail.type'
import { sendErrorEmailToAdmin } from '@/utils/email/sendErrorEmailToAdmin'

export const sendDailyProblemEmail = async ({
  problem_slug,
  difficulty,
  topic,
  group_no,
  email,
}: SendDailyProblemEmail) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const projectRoot = process.cwd()
    const templatePath = path.join(
      projectRoot,
      'public',
      'dailyProblemEmailTemplate.html'
    )

    let htmlContent = await fs.promises.readFile(templatePath, 'utf-8')
    const groupLink = `https://pstrack.tech/g/${group_no}`

    htmlContent = htmlContent
      .replace(/{{problem_slug}}/g, problem_slug)
      .replace(/{{difficulty}}/g, difficulty)
      .replace(/{{topic}}/g, topic)
      .replace(/{{group_link}}/g, groupLink)

    return await resend.emails.send({
      from: 'info@pstrack.tech',
      to: email,
      subject: 'LeetCode Streak Reminder: Can You Solve It?',
      html: htmlContent,
    })
  } catch (error) {
    await sendErrorEmailToAdmin(error, 'sendDailyProblemEmail')
  }
}
