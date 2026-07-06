import MagicLinkEmail from "@/emails/magic-link"
import { env } from "@/env"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"

export const sendMagicLinkEmail = async ({
	email,
	url,
}: {
	email: string
	url: string
}) => {
	// Rewrite the verify URL to /api/magic-link - a plain HTML endpoint that
	// uses JS to redirect to the actual verify path. Email pre-fetchers (e.g.
	// Gmail) don't execute JS so the one-time token isn't consumed early.
	const redirectUrl = new URL(url)
	redirectUrl.pathname = "/api/v3/magic-link"
	logger.debug({ redirectUrl: redirectUrl.toString() }, "magic link redirect")

	try {
		await sendEmail({
			from: env.EMAIL_FROM,
			to: email,
			subject: "Sign in to PStrack",
			react: MagicLinkEmail({ url: redirectUrl.toString() }),
		})
	} catch (err) {
		logger.error({ err, email }, "magic link email failed")
		if (env.NODE_ENV === "development") {
			logger.warn(
				{ err, email, url: redirectUrl.toString() },
				"magic link email failed in development; using logged link fallback"
			)
			return
		}
		throw err
	}
}
