import { db } from "@pstrack/db";
import * as schema from "@pstrack/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

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
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	trustedOrigins: [process.env.BETTER_AUTH_URL as string],
	baseURL: process.env.BETTER_AUTH_URL,
	secret: process.env.BETTER_AUTH_SECRET,
	url: process.env.BETTER_AUTH_URL,
});
