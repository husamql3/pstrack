import { render } from "@react-email/render"
import type { ReactElement } from "react"
import { Resend } from "resend"

import { env } from "@/env"
import { logger } from "@/server/lib/logger"

/**
 * Every email type carries a tag. It surfaces in Postal's UI for filtering and
 * doubles as the canary router key (see EMAIL_RESEND_TAGS).
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

type Provider = "postal" | "resend" | "log"

/**
 * Resolve which transport handles this email. "log" (dev + staging) short-circuits
 * everything; otherwise the configured default provider is used, except for tags
 * explicitly pinned to Resend during the Postal cutover canary.
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

// --- Resend (retained for the canary only) --------------------------------

let resendClient: Resend | null = null

/**
 * Build the Resend client lazily. Eager construction throws ("Missing API key")
 * whenever RESEND_API_KEY is absent — e.g. CI/test runs or once we've fully cut
 * over to Postal — which would crash any module that merely imports this file.
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

// --- Postal (self-hosted, HTTP API) ---------------------------------------

const sendViaPostal = async (args: {
	from: string
	to: string[]
	subject: string
	html: string
	text: string
	tag: EmailTag
	replyTo?: string
}) => {
	if (!env.POSTAL_API_URL || !env.POSTAL_API_KEY) {
		throw new Error("Postal is not configured (POSTAL_API_URL / POSTAL_API_KEY)")
	}

	const url = `${env.POSTAL_API_URL.replace(/\/$/, "")}/api/v1/send/message`
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Server-API-Key": env.POSTAL_API_KEY,
		},
		body: JSON.stringify({
			to: args.to,
			from: args.from,
			subject: args.subject,
			html_body: args.html,
			plain_body: args.text,
			tag: args.tag,
			...(args.replyTo ? { reply_to: args.replyTo } : {}),
		}),
	})

	const payload = (await res.json().catch(() => null)) as {
		status?: string
		data?: { message_id?: string; code?: string; message?: string }
	} | null

	if (!res.ok || payload?.status !== "success") {
		const message = payload?.data?.message ?? payload?.status ?? `HTTP ${res.status}`
		logger.error(
			{
				status: res.status,
				code: payload?.data?.code,
				to: args.to,
				subject: args.subject,
				tag: args.tag,
			},
			"postal send failed"
		)
		throw new Error(`Postal: ${message}`)
	}

	const id = payload.data?.message_id
	logger.debug(
		{ id, to: args.to, subject: args.subject, tag: args.tag },
		"postal send ok"
	)
	return { id }
}

// --- Public API ------------------------------------------------------------

/**
 * Send a transactional email. React Email templates are rendered to HTML + text
 * in-app, then handed to the resolved transport (Postal / Resend / log). The
 * signature is unchanged from the Resend-only era apart from the required `tag`.
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
	return sendViaPostal({
		from: fromAddress,
		to: recipients,
		subject,
		html,
		text,
		tag,
		replyTo,
	})
}
