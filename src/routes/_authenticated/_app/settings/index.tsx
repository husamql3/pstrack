import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/_app/settings/")({
	beforeLoad: () => {
		throw redirect({ to: "/settings/account" })
	},
})
