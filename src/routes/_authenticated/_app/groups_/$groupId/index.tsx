import { createFileRoute } from "@tanstack/react-router"

import { GroupOverview } from "@/features/groups/components/group-overview"

export const Route = createFileRoute("/_authenticated/_app/groups_/$groupId/")({
	component: GroupOverview,
})
