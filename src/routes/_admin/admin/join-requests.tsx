import { createFileRoute } from "@tanstack/react-router"

import { AdminJoinRequestsFirehose } from "@/features/admin/components/admin-join-requests-firehose"

export const Route = createFileRoute("/_admin/admin/join-requests")({
	component: AdminJoinRequestsFirehose,
})
