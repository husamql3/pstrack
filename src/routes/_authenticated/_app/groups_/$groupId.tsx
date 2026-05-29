import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { GroupLayout } from "@/features/groups/components/group-layout"

const groupSearchSchema = z.object({
	range: z.enum(["7d", "30d", "all"]).catch("7d").default("7d"),
})

export const Route = createFileRoute("/_authenticated/_app/groups_/$groupId")({
	validateSearch: groupSearchSchema,
	component: GroupLayout,
})
