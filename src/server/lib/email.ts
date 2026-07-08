import { type CreateEmailOptions, Resend } from "resend"

import { env } from "@/env"
import { logger } from "@/server/lib/logger"

let client: Resend | null = null

/**
 * Construct the Resend client lazily on first use. Building it eagerly at module
 * load throws ("Missing API key") whenever RESEND_API_KEY is absent — e.g. CI
 * test runs that set SKIP_ENV_VALIDATION and don't provide email secrets. That
 * would crash any module (or test suite) that merely imports this file, even if
 * it never sends an email. Deferring construction keeps the module import-safe.
 */
const getClient = (): Resend => {
	if (!client) client = new Resend(env.RESEND_API_KEY)
	return client
}

/**
 * Proxy over the lazily-created client, preserving the full call surface
 * (`resend.emails.send(...)`, `resend.batch.send(...)`) for existing consumers.
 */
export const resend: Resend = new Proxy({} as Resend, {
	get: (_target, prop) => Reflect.get(getClient(), prop),
})

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
