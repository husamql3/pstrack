import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ context, location }) => {
		const { session } = context as {
			session: { user: { username?: string | null; role?: string | null } } | null
		}

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
