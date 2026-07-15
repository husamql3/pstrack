import OtpCodeEmail, { type OtpType } from "@/emails/otp-code"
import { env } from "@/env"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"

const SUBJECTS: Record<OtpType, string> = {
	"sign-in": "Your PStrack sign-in code",
	"email-verification": "Your PStrack verification code",
	"forget-password": "Your PStrack password reset code",
	"change-email": "Confirm your new PStrack email",
}

/**
 * Send a one-time verification code. Used by the Better Auth emailOTP plugin's
 * `sendVerificationOTP` callback — the change-email flow sends two codes through
 * here: one to the current inbox (`email-verification`) and one to the new inbox
 * (`change-email`).
 *
 * Mirrors `sendMagicLinkEmail`: in development a Resend failure logs the code and
 * resolves (so the flow is testable without email creds); in production it rethrows.
 */
export const sendOtpEmail = async ({
	email,
	otp,
	type,
}: {
	email: string
	otp: string
	type: OtpType
}) => {
	try {
		await sendEmail({
			from: env.EMAIL_FROM,
			to: email,
			subject: SUBJECTS[type] ?? "Your PStrack code",
			react: OtpCodeEmail({ otp, type }),
		})
	} catch (err) {
		logger.error({ err, email, type }, "otp email failed")
		if (env.NODE_ENV === "development") {
			logger.warn(
				{ err, email, otp, type },
				"otp email failed in development; using logged code fallback"
			)
			return
		}
		throw err
	}
}
