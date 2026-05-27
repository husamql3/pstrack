"use client"

import { IconX } from "@tabler/icons-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const latestChange = {
	title: "Real-time funnels",
	description:
		"Build and analyze conversion funnels with live event streaming in real-time.",
	url: "#",
} as const

export function LatestChange() {
	const [isOpen, setIsOpen] = useState(true)

	if (!isOpen) {
		return null
	}

	return (
		<div
			className={cn(
				"rounded-xl group/latest-change z-20 size-full justify-center border bg-background"
			)}
		>
			<div className="relative flex size-full flex-col gap-1.5 overflow-hidden px-3 pt-4 pb-1">
				<p className="font-medium text-xs">{latestChange.title}</p>
				<span className="text-[10px] text-muted-foreground">
					{latestChange.description}
				</span>
				<Button
					asChild
					className="w-max px-0 font-light text-xs"
					size="sm"
					variant="link"
				>
					<a href={latestChange.url}>Read more</a>
				</Button>
				<Button
					className="absolute top-2 right-2 z-10 size-6 rounded-full opacity-0 transition-opacity group-hover/latest-change:opacity-100"
					onClick={() => setIsOpen(false)}
					size="icon-sm"
					variant="secondary"
				>
					<IconX className="size-3.5 text-muted-foreground" />
				</Button>
			</div>
		</div>
	)
}
