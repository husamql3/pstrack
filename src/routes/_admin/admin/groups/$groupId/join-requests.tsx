import { createFileRoute } from "@tanstack/react-router"

import { AdminGroupJoinRequests } from "@/features/admin/components/admin-group-join-requests"

export const Route = createFileRoute("/_admin/admin/groups/$groupId/join-requests")({
	component: AdminGroupJoinRequests,
})
