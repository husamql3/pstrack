import { createFileRoute } from "@tanstack/react-router"

import { AdminGroupSettings } from "@/features/admin/components/admin-group-settings"

export const Route = createFileRoute("/_admin/admin/groups/$groupId/settings")({
	component: AdminGroupSettings,
})
