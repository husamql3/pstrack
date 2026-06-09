import type { ReactNode } from "react"

export const AdminEmpty = ({
	title,
	description,
	action,
}: {
	title: string
	description?: string
	action?: ReactNode
}) => (
	<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
		<p className="font-medium">{title}</p>
		{description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
		{action ? <div className="pt-2">{action}</div> : null}
	</div>
)
