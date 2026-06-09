import type { ReactNode } from "react"

export const AdminPageHeader = ({
	title,
	description,
	actions,
}: {
	title: string
	description?: string
	actions?: ReactNode
}) => (
	<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
		<div className="flex flex-col gap-1">
			<h1 className="font-semibold text-xl tracking-tight">{title}</h1>
			{description ? (
				<p className="text-muted-foreground text-sm">{description}</p>
			) : null}
		</div>
		{actions ? <div className="flex items-center gap-2">{actions}</div> : null}
	</div>
)
