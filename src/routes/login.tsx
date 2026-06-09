import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { AuthPage } from "@/components/auth-page"
import { createSeoHead } from "@/lib/seo"

const searchSchema = z.object({
	redirect: z.string().optional(),
})

export const Route = createFileRoute("/login")({
	ssr: false,
	validateSearch: searchSchema,
	component: LoginPage,
	head: () =>
		createSeoHead({
			title: "Sign in",
			description:
				"Sign in to PStrack with Google, GitHub, or a magic link. Track your LeetCode solves, build streaks, and join study groups.",
			path: "/login",
			noindex: true,
		}),
})

function LoginPage() {
	const { redirect } = Route.useSearch()
	return <AuthPage redirect={redirect} />
}
