import openapi from "@elysiajs/openapi"
import { Elysia } from "elysia"

export const docs = new Elysia({ name: "docs" }).use(
	openapi({
		provider: "scalar",
		documentation: {
			info: {
				title: "PStrack API",
				version: "3.0.0",
			},
			tags: [
				{ name: "Auth", description: "Better Auth handler and magic-link redirect" },
				{ name: "Health", description: "Liveness and database connectivity" },
				{
					name: "Users",
					description: "User profile, username, and platform handle validation",
				},
				{ name: "Groups", description: "Group membership, invites, join requests" },
				{ name: "Problems", description: "Daily problem assignment, solve, and pause" },
				{ name: "Admin", description: "Platform-admin-only operations" },
			],
		},
		scalar: {
			theme: "alternate",
		},
	})
)
