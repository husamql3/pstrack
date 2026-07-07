import ProUnlockedByPurchaseEmail from "@/emails/pro-unlocked-by-purchase"
import { env } from "@/env"
import { ProSource } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")

/**
 * A Polar order/refund payload identifies the customer by `externalId` (set to
 * the pstrack user id on sign-up via `createCustomerOnSignUp`) with `email` as a
 * fallback. This is the ONLY mapping from a Polar customer back to a user.
 */
export type PolarCustomerRef = {
	externalId?: string | null
	email?: string | null
}

const resolveUser = async (customer: PolarCustomerRef) => {
	if (customer.externalId) {
		const byId = await db.user.findUnique({
			where: { id: customer.externalId },
			select: { id: true, email: true, name: true, isPro: true, proSource: true },
		})
		if (byId) return byId
	}
	if (customer.email) {
		return db.user.findUnique({
			where: { email: customer.email },
			select: { id: true, email: true, name: true, isPro: true, proSource: true },
		})
	}
	return null
}

/**
 * Grant lifetime Pro from a completed Polar purchase. Idempotent: a redelivered
 * `order.paid` webhook is a no-op once the user already holds purchase-sourced
 * Pro, so we never double-send the confirmation email.
 */
export const grantProFromPurchase = async (customer: PolarCustomerRef): Promise<void> => {
	const user = await resolveUser(customer)
	if (!user) {
		logger.error(
			{ externalId: customer.externalId, email: customer.email },
			"polar order paid: could not resolve user — Pro NOT granted"
		)
		return
	}

	// Fully idempotent: already Pro from this exact source → nothing to do.
	if (user.isPro && user.proSource === ProSource.POLAR_PURCHASE) return

	const wasPro = user.isPro

	await db.user.update({
		where: { id: user.id },
		data: {
			isPro: true,
			proSource: ProSource.POLAR_PURCHASE,
			proExpiresAt: null,
		},
	})

	// Only email someone who wasn't already Pro (e.g. a points/admin Pro who then
	// buys just gets the source re-attributed, no "welcome to Pro" email).
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
 * purchase. A user who also crossed the points threshold or holds an admin grant
 * keeps their Pro; we never claw back Pro they earned another way.
 */
export const revokeProFromRefund = async (customer: PolarCustomerRef): Promise<void> => {
	const user = await resolveUser(customer)
	if (!user) return
	if (user.proSource !== ProSource.POLAR_PURCHASE) return

	await db.user.update({
		where: { id: user.id },
		data: { isPro: false, proSource: null, proExpiresAt: null },
	})
	logger.info({ userId: user.id }, "polar refund: revoked purchase-sourced Pro")
}
