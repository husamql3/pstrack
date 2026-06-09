import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { AuthPage } from "@/components/auth-page"

const searchSchema = z.object({
	redirect: z.string().optional(),
})

export const Route = createFileRoute("/login")({
	validateSearch: searchSchema,
	component: LoginPage,
})

function LoginPage() {
	const { redirect } = Route.useSearch()
	return <AuthPage redirect={redirect} />
}
