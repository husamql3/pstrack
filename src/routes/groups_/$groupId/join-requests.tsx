import { createFileRoute, redirect } from "@tanstack/react-router"

import { GroupJoinRequests } from "@/features/groups/components/group-join-requests"

export const Route = createFileRoute("/groups_/$groupId/join-requests")({
	beforeLoad: ({ context, location }) => {
		if (!context.session) {
			throw redirect({ to: "/login", search: { redirect: location.pathname } })
		}
	},
	component: GroupJoinRequests,
})
