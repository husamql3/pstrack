import { createFileRoute } from "@tanstack/react-router"

import { RouteErrorFallback } from "@/components/route-error-fallback"
import { GroupProblemsTable } from "@/features/groups/components/group-problems-table"

export const Route = createFileRoute("/groups_/$groupId/")({
	component: GroupProblemsTable,
	errorComponent: ({ error, reset }) => (
		<RouteErrorFallback error={error} reset={reset} title="Could not load this group" />
	),
})
