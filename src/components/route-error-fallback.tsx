import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type RouteErrorFallbackProps = {
	error?: Error
	reset?: () => void
	title?: string
	className?: string
}

export const RouteErrorFallback = ({
	error,
	reset,
	title = "Something went wrong",
	className,
}: RouteErrorFallbackProps) => (
	<div
		className={cn(
			"flex flex-col items-center justify-center gap-3 rounded-xl border border-border border-dashed bg-card/40 p-10 text-center",
			className
		)}
	>
		<div className="flex size-10 items-center justify-center rounded-lg bg-muted text-destructive">
			<IconAlertTriangle className="size-5" />
		</div>
		<div className="space-y-1">
			<p className="font-medium text-sm">{title}</p>
			<p className="max-w-md text-muted-foreground text-sm">
				{error?.message?.trim() || "Refresh the page or try again in a moment."}
			</p>
		</div>
		{reset && (
			<Button onClick={reset} size="sm" variant="outline">
				<IconRefresh className="size-4" />
				Try again
			</Button>
		)}
	</div>
)
