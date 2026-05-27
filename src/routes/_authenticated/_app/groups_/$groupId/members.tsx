import { createFileRoute } from "@tanstack/react-router"

import { GroupMembers } from "@/features/groups/components/group-members"

export const Route = createFileRoute("/_authenticated/_app/groups_/$groupId/members")({
	component: GroupMembers,
})
