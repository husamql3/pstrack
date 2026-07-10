import { render } from "@react-email/render"
import nodemailer, { type Transporter } from "nodemailer"
import type { ReactElement } from "react"
import { Resend } from "resend"

import { env } from "@/env"
import { logger } from "@/server/lib/logger"

/**
 * Every email type carries a tag. It rides along as an `X-Mail-Tag` header (so the
 * self-hosted mail server can filter/log by type) and doubles as the canary router
 * key (see EMAIL_RESEND_TAGS).
 */
export type EmailTag =
	| "magic-link"
	| "welcome"
	| "daily-digest"
	| "join-approved"
	| "join-rejected"
	| "join-expired"
	| "removed-from-group"
	| "inactivity-warning"
	| "badge-earned"
	| "streak-milestone"
	| "pro-unlocked-points"
	| "pro-unlocked-purchase"
	| "admin"

type SendEmailInput = {
	to: string | string[]
	subject: string
	react: ReactElement
	tag: EmailTag
	from?: string
	replyTo?: string
}

type Provider = "smtp" | "resend" | "log"

/**
 * Resolve which transport handles this email. "log" (dev + staging) short-circuits
 * everything; otherwise the configured default provider (self-hosted SMTP) is used,
 * except for tags explicitly pinned to Resend during the cutover canary.
 */
const resolveProvider = (tag: EmailTag): Provider => {
	const base = env.EMAIL_TRANSPORT ?? "log"
	if (base === "log") return "log"

	const resendTags = (env.EMAIL_RESEND_TAGS ?? "")
		.split(",")
		.map((t) => t.trim())
		.filter(Boolean)
	if (resendTags.includes(tag)) return "resend"

	return base
}

const toRecipients = (to: string | string[]): string[] => (Array.isArray(to) ? to : [to])

// --- Self-hosted SMTP (Stalwart) ------------------------------------------

let transporter: Transporter | null = null

/**
 * Build the SMTP transporter lazily. Deferring construction keeps the module
 * import-safe: it never throws at import time when SMTP env is absent (CI/tests,
 * or the `log` transport in dev/staging).
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

const sendViaSmtp = async (args: {
	from: string
	to: string[]
	subject: string
	html: string
	text: string
	tag: EmailTag
	replyTo?: string
}) => {
	const info = await getTransporter().sendMail({
		from: args.from,
		to: args.to,
		subject: args.subject,
		html: args.html,
		text: args.text,
		headers: { "X-Mail-Tag": args.tag },
		...(args.replyTo ? { replyTo: args.replyTo } : {}),
	})

	if (info.rejected && info.rejected.length > 0) {
		logger.error(
			{ rejected: info.rejected, to: args.to, subject: args.subject, tag: args.tag },
			"smtp send rejected"
		)
		throw new Error(`SMTP rejected: ${info.rejected.join(", ")}`)
	}

	logger.debug(
		{ id: info.messageId, to: args.to, subject: args.subject, tag: args.tag },
		"smtp send ok"
	)
	return { id: info.messageId }
}

// --- Resend (retained for the canary only) --------------------------------

let resendClient: Resend | null = null

/**
 * Build the Resend client lazily. Eager construction throws ("Missing API key")
 * whenever RESEND_API_KEY is absent — e.g. CI/test runs or once we've fully cut
 * over to self-hosted SMTP — which would crash any module that merely imports this
 * file.
 */
const getResend = (): Resend => {
	if (!env.RESEND_API_KEY) throw new Error("Resend is not configured (RESEND_API_KEY)")
	if (!resendClient) resendClient = new Resend(env.RESEND_API_KEY)
	return resendClient
}

const sendViaResend = async (args: {
	from: string
	to: string[]
	subject: string
	html: string
	text: string
	replyTo?: string
}) => {
	const result = await getResend().emails.send({
		from: args.from,
		to: args.to,
		subject: args.subject,
		html: args.html,
		text: args.text,
		...(args.replyTo ? { replyTo: args.replyTo } : {}),
	})
	if (result.error) {
		logger.error(
			{ err: result.error, to: args.to, subject: args.subject },
			"resend send failed"
		)
		throw new Error(`Resend: ${result.error.name} - ${result.error.message}`)
	}
	return { id: result.data?.id }
}

// --- Public API ------------------------------------------------------------

/**
 * Send a transactional email. React Email templates are rendered to HTML + text
 * in-app, then handed to the resolved transport (self-hosted SMTP / Resend / log).
 * The signature is unchanged from the Resend-only era apart from the required `tag`.
 */
export const sendEmail = async ({
	to,
	subject,
	react,
	tag,
	from,
	replyTo,
}: SendEmailInput) => {
	const fromAddress = from ?? env.EMAIL_FROM ?? "PStrack <info@pstrack.app>"
	const recipients = toRecipients(to)
	const provider = resolveProvider(tag)

	if (provider === "log") {
		logger.info(
			{ to: recipients, subject, tag, from: fromAddress },
			"email (log transport)"
		)
		return { id: `log-${tag}` }
	}

	const html = await render(react)
	const text = await render(react, { plainText: true })

	if (provider === "resend") {
		return sendViaResend({
			from: fromAddress,
			to: recipients,
			subject,
			html,
			text,
			replyTo,
		})
	}
	return sendViaSmtp({
		from: fromAddress,
		to: recipients,
		subject,
		html,
		text,
		tag,
		replyTo,
	})
}
