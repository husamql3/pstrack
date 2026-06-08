import { checkout, polar } from "@polar-sh/better-auth"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, magicLink } from "better-auth/plugins"

import MagicLinkEmail from "@/emails/magic-link"
import WelcomeEmail from "@/emails/welcome"
import { env } from "@/env"
import { db } from "@/server/lib/db"
import { resend } from "@/server/lib/email"
import { polarClient } from "@/server/lib/polar"

export const auth = betterAuth({
	database: prismaAdapter(db, { provider: "postgresql" }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
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
					await resend.emails.send({
						from: env.EMAIL_FROM,
						to: user.email,
						subject: "Welcome to PSTrack",
						react: WelcomeEmail({ name: user.name }),
					})
				},
			},
		},
	},
	plugins: [
		magicLink({
			sendMagicLink: async ({ email, url }) => {
				// Rewrite the verify URL to /api/magic-link - a plain HTML endpoint that
				// uses JS to redirect to the actual verify path. Email pre-fetchers (e.g.
				// Gmail) don't execute JS so the one-time token isn't consumed early.
				const redirectUrl = new URL(url)
				redirectUrl.pathname = "/api/v3/magic-link"
				console.info("redirectUrl", redirectUrl.toString())
				await resend.emails.send({
					from: env.EMAIL_FROM,
					to: email,
					subject: "Sign in to PSTrack",
					react: MagicLinkEmail({ url: redirectUrl.toString() }),
				})
			},
		}),
		admin(),
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({
					products: [
						{
							productId: "8b656c17-a416-4ef8-865a-a45a02ea7735",
							slug: "pstrack",
						},
					],
					successUrl: env.POLAR_SUCCESS_URL,
					authenticatedUsersOnly: true,
				}),
			],
		}),
	],
})

export type Auth = typeof auth
