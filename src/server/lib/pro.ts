import ProUnlockedByPurchaseEmail from "@/emails/pro-unlocked-by-purchase"
import { env } from "@/env"
import { ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")

const USER_SELECT = {
	id: true,
	email: true,
	emailVerified: true,
	name: true,
	isPro: true,
	proSource: true,
} as const

/**
 * A Polar order/refund payload identifies the customer by `externalId` (set to
 * the pstrack user id on sign-up via `createCustomerOnSignUp`) with `email` as a
 * fallback. This is the ONLY mapping from a Polar customer back to a user.
 */
export type PolarCustomerRef = {
	externalId?: string | null
	email?: string | null
}

type ResolvedUser = {
	user: {
		id: string
		email: string
		emailVerified: boolean
		name: string
		isPro: boolean
		proSource: ProSource | null
	}
	via: "externalId" | "email"
}

/**
 * Resolve a Polar customer back to a pstrack user. Prefer `externalId` (set
 * server-side to the user id on sign-up — the trusted path). The `email`
 * fallback is defence-in-depth-gated on `emailVerified` so an unverified
 * address can never be used to steer a grant.
 */
const resolveUser = async (customer: PolarCustomerRef): Promise<ResolvedUser | null> => {
	if (customer.externalId) {
		const byId = await db.user.findUnique({
			where: { id: customer.externalId },
			select: USER_SELECT,
		})
		if (byId) return { user: byId, via: "externalId" }
	}
	if (customer.email) {
		const byEmail = await db.user.findUnique({
			where: { email: customer.email },
			select: USER_SELECT,
		})
		if (byEmail?.emailVerified) return { user: byEmail, via: "email" }
	}
	return null
}

/**
 * Grant lifetime Pro from a completed Polar purchase. Idempotent: a redelivered
 * `order.paid` webhook is a no-op once the user already holds purchase-sourced
 * Pro, so we never double-send the confirmation email.
 */
export const grantProFromPurchase = async (customer: PolarCustomerRef): Promise<void> => {
	const resolved = await resolveUser(customer)
	if (!resolved) {
		// Never log the raw email (PII). externalId is the user id, safe to log.
		logger.error(
			{ externalId: customer.externalId ?? null, hasEmail: Boolean(customer.email) },
			"polar order paid: could not resolve user — Pro NOT granted"
		)
		return
	}

	const { user, via } = resolved
	if (via === "email") {
		logger.warn(
			{ userId: user.id },
			"polar order paid: resolved user via email fallback, not externalId"
		)
	}

	// Fully idempotent: already Pro from a purchase → nothing to do.
	if (user.isPro && user.proSource === ProSource.POLAR_PURCHASE) return

	const wasPro = user.isPro

	await db.user.update({
		where: { id: user.id },
		data: {
			isPro: true,
			// Preserve an independently-earned source (points / admin grant) so a
			// later refund can't claw back Pro the user did NOT buy. Only stamp
			// POLAR_PURCHASE (and clear expiry) when they weren't already Pro.
			...(wasPro ? {} : { proSource: ProSource.POLAR_PURCHASE, proExpiresAt: null }),
		},
	})

	// Only email someone who wasn't already Pro; an existing Pro who buys just
	// funds the project — no "welcome to Pro" email.
	if (!wasPro) {
		sendEmail({
			from: env.EMAIL_FROM,
			to: user.email,
			subject: "Your PStrack Pro is active",
			react: ProUnlockedByPurchaseEmail({
				name: user.name,
				dashboardUrl: `${BASE_URL}/dashboard`,
			}),
		}).catch((err) => captureServerException(err, { tag: "email:pro-unlocked-purchase" }))
	}
}

/**
 * Revoke Pro on a Polar refund — but ONLY when the account's Pro came from a
 * purchase. A user who crossed the points threshold or holds an admin grant
 * keeps their Pro; we never claw back Pro they earned another way. Combined with
 * the source-preserving grant above, a points/admin Pro who also bought (and is
 * therefore still `POINTS_THRESHOLD`/`ADMIN_GRANT`) is safe from refund revoke.
 */
export const revokeProFromRefund = async (customer: PolarCustomerRef): Promise<void> => {
	const resolved = await resolveUser(customer)
	if (!resolved) return
	const { user } = resolved
	if (user.proSource !== ProSource.POLAR_PURCHASE) return

	await db.user.update({
		where: { id: user.id },
		data: { isPro: false, proSource: null, proExpiresAt: null },
	})
	logger.info({ userId: user.id }, "polar refund: revoked purchase-sourced Pro")
}
