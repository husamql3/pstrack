import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		const { session } = context
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			})
		}
		if (!session.user.username && location.pathname !== "/onboarding") {
			throw redirect({ to: "/onboarding" })
		}
	},
	component: () => <Outlet />,
})
