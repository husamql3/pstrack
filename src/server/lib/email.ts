import { type CreateEmailOptions, Resend } from "resend"

import { env } from "@/env"
import { logger } from "@/server/lib/logger"

export const resend = new Resend(env.RESEND_API_KEY)

export const sendEmail = async (payload: CreateEmailOptions) => {
	const result = await resend.emails.send(payload)
	if (result.error) {
		logger.error(
			{ err: result.error, to: payload.to, subject: payload.subject, from: payload.from },
			"resend send failed"
		)
		throw new Error(`Resend: ${result.error.name} - ${result.error.message}`)
	}
	logger.debug(
		{ id: result.data?.id, to: payload.to, subject: payload.subject },
		"resend send ok"
	)
	return result.data
}
