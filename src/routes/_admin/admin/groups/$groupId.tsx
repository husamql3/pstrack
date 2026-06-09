import { createFileRoute } from "@tanstack/react-router"

import { AdminGroupDetailLayout } from "@/features/admin/components/admin-group-detail-layout"

export const Route = createFileRoute("/_admin/admin/groups/$groupId")({
	component: AdminGroupDetailLayout,
})
