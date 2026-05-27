import { createFileRoute } from "@tanstack/react-router"

import { GroupLayout } from "@/features/groups/components/group-layout"

export const Route = createFileRoute("/_authenticated/_app/groups_/$groupId")({
	component: GroupLayout,
})
