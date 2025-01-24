import { Resend } from 'resend'
import fs from 'fs'
import path from 'path'

export const sendErrorEmailToAdmin = async (error: unknown, context: string) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = process.env.ADMIN_EMAIL as string

    const projectRoot = process.cwd()
    const templatePath = path.join(projectRoot, 'public', 'errorEmailTemplate.html')

    let htmlContent = await fs.promises.readFile(templatePath, 'utf-8')

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available'

    htmlContent = htmlContent
      .replace(/{{context}}/g, context)
      .replace(/{{errorMessage}}/g, errorMessage)
      .replace(/{{errorStack}}/g, errorStack || 'No stack trace available')

    const res = await resend.emails.send({
      from: 'info@pstrack.tech',
      to: adminEmail,
      subject: 'Error Occurred in PSTrack',
      html: htmlContent,
    })

    console.log('Error email sent to admin:', res)
    return res
  } catch (emailError) {
    console.error('Failed to send error email to admin:', emailError)
  }
}
