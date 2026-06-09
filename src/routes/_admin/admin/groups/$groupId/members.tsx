import { createFileRoute } from "@tanstack/react-router"

import { AdminGroupMembers } from "@/features/admin/components/admin-group-members"

export const Route = createFileRoute("/_admin/admin/groups/$groupId/members")({
	component: AdminGroupMembers,
})
