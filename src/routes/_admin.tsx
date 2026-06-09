import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { AdminShell } from "@/components/admin/admin-shell"

export const Route = createFileRoute("/_admin")({
	beforeLoad: ({ context, location }) => {
		const { session } = context
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.pathname },
			})
		}
		if (session.user.role !== "admin") {
			throw redirect({ to: "/dashboard" })
		}
	},
	component: AdminLayout,
})

function AdminLayout() {
	return (
		<AdminShell>
			<Outlet />
		</AdminShell>
	)
}
