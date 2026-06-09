import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { AppHeader } from "@/components/app-header"
import { GroupLayout } from "@/features/groups/components/group-layout"

const groupSearchSchema = z.object({
	range: z.enum(["7d", "30d", "all"]).catch("7d").default("7d"),
})

export const Route = createFileRoute("/groups_/$groupId")({
	ssr: false,
	validateSearch: groupSearchSchema,
	component: GroupPage,
})

function GroupPage() {
	return (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<GroupLayout />
			</main>
		</div>
	)
}
