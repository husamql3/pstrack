import { render } from "@react-email/render"
import nodemailer, { type Transporter } from "nodemailer"
import type { ReactElement } from "react"
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

const resend: Resend = new Proxy({} as Resend, {
	get: (_target, prop) => Reflect.get(getClient(), prop),
})

// --- Self-hosted SMTP (Stalwart) ------------------------------------------

let transporter: Transporter | null = null

/**
 * Build the SMTP transporter lazily, for the same import-safety reason as the
 * Resend client above: it must never throw at import time when SMTP env is
 * absent (CI/tests, or the `log`/`resend` transports).
 */
const getTransporter = (): Transporter => {
	if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
		throw new Error("SMTP is not configured (SMTP_HOST / SMTP_USER / SMTP_PASS)")
	}
	if (!transporter) {
		// Prod skips env validation, so SMTP_PORT can arrive as a raw string — coerce.
		const port = Number(env.SMTP_PORT) || 587
		transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port,
			secure: port === 465, // implicit TLS on 465, STARTTLS on submission ports
			requireTLS: port !== 465,
			auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
		})
	}
	return transporter
}

const sendViaSmtp = async (payload: CreateEmailOptions) => {
	// React Email templates are rendered to HTML + text in-app (Resend does this
	// server-side; SMTP needs the rendered strings). `react` is always a JSX
	// element at the call sites, but CreateEmailOptions types it as ReactNode.
	const element = payload.react as ReactElement | undefined
	const html = payload.html ?? (element ? await render(element) : undefined)
	const text =
		payload.text ?? (element ? await render(element, { plainText: true }) : undefined)

	const info = await getTransporter().sendMail({
		from: payload.from,
		to: payload.to,
		subject: payload.subject,
		html,
		text,
		...(payload.replyTo
			? {
					replyTo: Array.isArray(payload.replyTo)
						? payload.replyTo.join(", ")
						: payload.replyTo,
				}
			: {}),
	})

	if (info.rejected && info.rejected.length > 0) {
		logger.error(
			{ rejected: info.rejected, to: payload.to, subject: payload.subject },
			"smtp send rejected"
		)
		throw new Error(`SMTP rejected: ${info.rejected.join(", ")}`)
	}
	logger.debug(
		{ id: info.messageId, to: payload.to, subject: payload.subject },
		"smtp send ok"
	)
	return { id: info.messageId }
}

// --- Public API ------------------------------------------------------------

export const sendEmail = async (payload: CreateEmailOptions) => {
	if (env.EMAIL_TRANSPORT === "log") {
		logger.info(
			{ recipientCount: Array.isArray(payload.to) ? payload.to.length : 1 },
			"email suppressed by log transport"
		)
		return null
	}

	if (env.EMAIL_TRANSPORT === "smtp") {
		return sendViaSmtp(payload)
	}

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
