import { createFileRoute } from "@tanstack/react-router"

import { GroupProblemsTable } from "@/features/groups/components/group-problems-table"

export const Route = createFileRoute("/groups_/$groupId/")({
	component: GroupProblemsTable,
})
