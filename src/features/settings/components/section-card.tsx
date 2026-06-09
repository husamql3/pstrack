import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const SectionCard = ({
	title,
	description,
	badge,
	tone = "default",
	children,
}: {
	title: string
	description?: string
	badge?: string
	tone?: "default" | "danger"
	children: ReactNode
}) => (
	<section
		className={cn(
			"rounded-xl border border-border bg-background p-6",
			tone === "danger" && "border-destructive/30"
		)}
	>
		<header className="mb-5 flex items-start justify-between gap-3">
			<div>
				<h2
					className={cn(
						"font-semibold text-base",
						tone === "danger" && "text-destructive"
					)}
				>
					{title}
				</h2>
				{description && (
					<p className="mt-1 text-muted-foreground text-sm">{description}</p>
				)}
			</div>
			{badge && (
				<Badge variant="secondary" className="shrink-0">
					{badge}
				</Badge>
			)}
		</header>
		{children}
	</section>
)
