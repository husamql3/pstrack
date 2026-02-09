import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";

export const auth = betterAuth({
	appName: "pstrack",
	basePath: "/api/auth",
	database: drizzleAdapter(db, { schema, provider: "pg" }),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		admin({
			adminRoles: ["admin"],
		}),
		openAPI(),
	],
	socialProviders: {
		// google: {
		// 	clientId: env.GOOGLE_CLIENT_ID as string,
		// 	clientSecret: env.GOOGLE_CLIENT_SECRET as string,
		// 	redirectURI: `${env.VITE_BASE_URL}/api/auth/callback/google`,
		// 	callbackURL: `${env.VITE_BASE_URL}/dashboard`,
		// },
		// github: {
		// 	clientId: env.GITHUB_CLIENT_ID as string,
		// 	clientSecret: env.GITHUB_CLIENT_SECRET as string,
		// 	redirectURI: `${env.VITE_BASE_URL}/api/auth/callback/github`,
		// 	callbackURL: `${env.VITE_BASE_URL}/dashboard`,
		// 	mapProfileToUser: (profile) => ({
		// 		username: profile.login ?? "",
		// 	}),
		// },
	},
	trustedOrigins: ["*"], // [env.VITE_BASE_URL],
	baseURL: env.BASE_URL,
	secret: env.BETTER_AUTH_SECRET,
	url: env.BASE_URL,
	logging: {
		level: "debug",
		format: "json",
		timestamp: true,
		caller: true,
		message: true,
	},
});
