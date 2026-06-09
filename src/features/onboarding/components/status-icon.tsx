import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react"

import type { FieldStatus } from "../types"

export const StatusIcon = ({ status }: { status: FieldStatus }) => {
	if (status === "checking")
		return <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
	if (status === "valid") return <IconCheck className="size-4 text-green-500" />
	if (status === "invalid") return <IconX className="size-4 text-destructive" />
	return null
}
