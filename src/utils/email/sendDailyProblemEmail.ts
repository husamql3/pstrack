import fs from 'node:fs/promises'
import path from 'node:path'

import { sendEmail } from './sendEmail'

export const sendDailyProblemEmail = async ({
  problem_slug,
  difficulty,
  topic,
  group_no,
  email,
}: {
  problem_slug: string
  difficulty: string
  topic: string
  group_no: string
  email: string
}) => {
  try {
    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'templates', 'daily-problem-email.html')

    let htmlContent = await fs.readFile(templatePath, 'utf-8')
    htmlContent = htmlContent
      .replace(/{{group_no}}/g, group_no.toString())
      .replace(/{{problem_slug}}/, problem_slug)
      .replace(/{{difficulty}}/, difficulty)
      .replace(/{{topic}}/, topic)

    await sendEmail({
      to: email,
      subject: "Today's LeetCode Problem 🧩",
      html: htmlContent,
    })
  } catch (error) {
    console.error('Error sending acceptance email:', error)
  }
}
