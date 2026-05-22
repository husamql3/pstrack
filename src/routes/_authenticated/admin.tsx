import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/admin")({
	beforeLoad: ({ context }) => {
		const { session } = context
		if (session?.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: () => <Outlet />,
})
