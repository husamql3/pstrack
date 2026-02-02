import { db } from "@pstrack/db";
import * as schema from "@pstrack/db";
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
			redirectURI: `http://localhost:8787/api/v3/auth/callback/google`,
			callbackURL: "http://localhost:3000/dashboard",
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
			redirectURI: `http://localhost:8787/api/v3/auth/callback/github`,
			callbackURL: "http://localhost:3000/dashboard",
		},
	},
	trustedOrigins: ["http://localhost:3000", "https://www.pstrack.app"], // todo: add in constants
	baseURL: process.env.BETTER_AUTH_URL, // todo: add in constants
	secret: process.env.BETTER_AUTH_SECRET,
	url: process.env.BETTER_AUTH_URL,
});
