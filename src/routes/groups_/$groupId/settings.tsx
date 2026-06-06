import { createFileRoute, redirect } from "@tanstack/react-router"

import { GroupSettings } from "@/features/groups/components/group-settings"

export const Route = createFileRoute("/groups_/$groupId/settings")({
	beforeLoad: ({ context, location }) => {
		if (!context.session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } })
		}
	},
	component: GroupSettings,
})
