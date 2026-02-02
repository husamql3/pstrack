import { db } from "@pstrack/db";
import * as schema from "@pstrack/db";
import { FRONTEND_URLS } from "@pstrack/shared/constants";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
// import { tanstackStartCookies } from "better-auth/tanstack-start";

export const auth = betterAuth({
	appName: "pstrack",
	basePath: "/api/v3/auth",
	database: drizzleAdapter(db, { schema, provider: "pg" }),
	emailAndPassword: {
		enabled: false,
	},
	plugins: [
		admin({
			adminRoles: ["admin"],
		}),
	],
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			redirectURI: `${process.env.VITE_BACKEND_URL}/api/v3/auth/callback/google`,
			callbackURL: `${process.env.VITE_FRONTEND_URL}/dashboard`,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			redirectURI: `${process.env.VITE_BACKEND_URL}/api/v3/auth/callback/github`,
			callbackURL: `${process.env.VITE_FRONTEND_URL}/dashboard`,
		},
	},
	trustedOrigins: FRONTEND_URLS,
	baseURL: process.env.VITE_BACKEND_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	url: process.env.VITE_BACKEND_URL,
});
