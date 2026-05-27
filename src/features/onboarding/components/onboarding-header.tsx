import { Link } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import type { Step } from "../types"

export const OnboardingHeader = ({ step }: { step: Step }) => {
	return (
		<header className="border-border/50 sticky top-0 border-b bg-background backdrop-blur-sm">
			<div className="mx-auto flex h-14 items-center justify-between px-4">
				<Link to="/" className="flex items-center gap-2">
					PStrack
					<Badge variant="outline">v4.0.0</Badge>
				</Link>
				{step > 0 && (
					<span className="text-muted-foreground text-sm">Step {step} of 2</span>
				)}
			</div>
		</header>
	)
}
