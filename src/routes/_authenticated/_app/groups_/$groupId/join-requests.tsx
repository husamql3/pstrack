import { createFileRoute } from "@tanstack/react-router"

import { GroupJoinRequests } from "@/features/groups/components/group-join-requests"

export const Route = createFileRoute(
	"/_authenticated/_app/groups_/$groupId/join-requests"
)({
	component: GroupJoinRequests,
})
