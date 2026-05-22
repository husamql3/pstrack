import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth"
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
				await resend.emails.send({
					from: env.EMAIL_FROM,
					to: email,
					subject: "Sign in to PSTrack",
					react: MagicLinkEmail({ url }),
				})
			},
		}),
		admin(),
		polar({
			client: polarClient,
			createCustomerOnSignUp: true,
			use: [
				checkout({ successUrl: "/dashboard" }),
				portal(),
				webhooks({ secret: env.POLAR_WEBHOOK_SECRET }),
			],
		}),
	],
})

export type Auth = typeof auth
