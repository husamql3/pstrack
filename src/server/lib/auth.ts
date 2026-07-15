import { dash } from "@better-auth/infra"
import { checkout, polar, webhooks } from "@polar-sh/better-auth"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, emailOTP, magicLink } from "better-auth/plugins"

import WelcomeEmail from "@/emails/welcome"
import { env } from "@/env"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { logger } from "@/server/lib/logger"
import { sendMagicLinkEmail } from "@/server/lib/magic-link-email"
import { sendOtpEmail } from "@/server/lib/otp-email"
import { polarClient } from "@/server/lib/polar"
import { grantProFromPurchase, revokeProFromRefund } from "@/server/lib/pro"

export const auth = betterAuth({
	appName: "PStrack",
	database: prismaAdapter(db, { provider: "postgresql" }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [env.BETTER_AUTH_URL, "https://www.pstrack.app"],
	basePath: "/api/v3/auth",
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["google", "github"],
		},
	},
	user: {
		additionalFields: {
			username: {
				type: "string",
				required: false,
				unique: true,
			},
			leetcodeHandle: {
				type: "string",
				required: false,
			},
			codeforcesHandle: {
				type: "string",
				required: false,
			},
			isPro: {
				type: "boolean",
				required: false,
				input: false,
			},
			proSource: {
				type: "string",
				required: false,
				input: false,
			},
			totalPoints: {
				type: "number",
				required: false,
				input: false,
			},
			currentStreak: {
				type: "number",
				required: false,
				input: false,
			},
		},
	},
	// todo add group no
	// session: {},
	databaseHooks: {
		user: {
			create: {
				after: async (user) => {
					try {
						await sendEmail({
							from: env.EMAIL_FROM,
							to: user.email,
							subject: "Welcome to PStrack",
							react: WelcomeEmail({ name: user.name }),
						})
					} catch (err) {
						logger.error({ err, userId: user.id }, "welcome email failed")
					}
					await notifyAdmin("user.created", {
						email: user.email,
						name: user.name ?? undefined,
						createdAt: new Date().toISOString(),
					})
				},
			},
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				await sendMagicLinkEmail({ email, url })
			},
		}),
		// Enables the change-email flow (issue #334). The core changeEmail plugin
		// is link-based; we use OTP codes instead. verifyCurrentEmail requires the
		// user to prove the CURRENT inbox (a code) before a code is sent to the NEW
		// inbox — so an account move needs control of both addresses.
		emailOTP({
			otpLength: 6,
			expiresIn: 300,
			storeOTP: "hashed",
			allowedAttempts: 3,
			changeEmail: { enabled: true, verifyCurrentEmail: true },
			sendVerificationOTP: async ({ email, otp, type }) => {
				await sendOtpEmail({ email, otp, type })
			},
		}),
		admin(),
		dash({
			apiKey: env.BETTER_AUTH_API_KEY,
			activityTracking: { enabled: true },
		}),
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					products: [
						{
							productId: env.POLAR_PRODUCT_ID,
							slug: "pstrack",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
				...(env.POLAR_WEBHOOK_SECRET
					? [
							webhooks({
								secret: env.POLAR_WEBHOOK_SECRET,
								onOrderPaid: async (payload) => {
									// Grant Pro FIRST (source of truth) — the Better Auth Polar
									// plugin does NOT set isPro automatically. Then notify admin.
									await grantProFromPurchase({
										externalId: payload.data.customer.externalId,
										email: payload.data.customer.email,
									})
									await notifyAdmin("purchase.pro", {
										email: payload.data.customer.email ?? undefined,
										plan: payload.data.product?.name ?? "Pro",
										amount: payload.data.netAmount,
										purchasedAt: new Date().toISOString(),
									})
								},
								onOrderRefunded: async (payload) => {
									// Lifetime Pro → a refund claws it back (only when the
									// account's Pro came from a purchase).
									await revokeProFromRefund({
										externalId: payload.data.customer.externalId,
										email: payload.data.customer.email,
									})
									await notifyAdmin("purchase.pro.refunded", {
										email: payload.data.customer.email ?? undefined,
										plan: payload.data.product?.name ?? "Pro",
										amount: payload.data.netAmount,
										refundedAt: new Date().toISOString(),
									})
								},
							}),
						]
					: []),
			],
		}),
	],
})

export type Auth = typeof auth
