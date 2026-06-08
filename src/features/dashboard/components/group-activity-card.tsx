import { Link } from "@tanstack/react-router"

import { Skeleton } from "@/components/ui/skeleton"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import type { GroupActivityEvent } from "@/server/groups/groups.type"

const timeAgo = (date: Date) => {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
	if (seconds < 60) return "just now"
	const minutes = Math.floor(seconds / 60)
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	return `${hours}h ago`
}

const EventRow = ({ event }: { event: GroupActivityEvent }) => {
	const handle = `@${event.username ?? event.name}`

	return (
		<div className="flex items-center gap-3 py-3">
			<HashAvatar username={event.username ?? event.name} size={28} />
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
				<span className="font-medium text-sm">{handle}</span>
				{event.type === "SOLVED" && (
					<>
						<span className="text-muted-foreground text-sm">solved</span>
						<span className="text-sm">
							#{event.problemRoadmapIndex} {event.problemTitle}
						</span>
					</>
				)}
				{event.type === "FIRST_SOLVE" && (
					<>
						<span className="text-muted-foreground text-sm">was first to solve</span>
						<span className="text-sm">
							#{event.problemRoadmapIndex} {event.problemTitle}
						</span>
					</>
				)}
				{event.type === "PAUSED" && (
					<span className="text-muted-foreground text-sm">paused today</span>
				)}
				{event.type === "JOINED" && (
					<>
						<span className="text-muted-foreground text-sm">joined</span>
						<span className="text-sm">@{event.groupSlug}</span>
					</>
				)}
			</div>
			<span className="shrink-0 text-muted-foreground text-xs tabular-nums">
				{timeAgo(event.at)}
			</span>
		</div>
	)
}

export const GroupActivityCard = ({
	groupId,
	groupSlug,
	events,
	isLoading,
}: {
	groupId: string
	groupSlug: string
	events: GroupActivityEvent[]
	isLoading: boolean
}) => {
	return (
		<div className="flex h-full flex-col rounded-lg border border-border bg-background p-5 md:p-6">
			<div className="flex items-center justify-between">
				<span className="font-medium text-sm">
					Group · <span className="text-muted-foreground">@{groupSlug}</span>
				</span>
				<Link
					className="text-muted-foreground text-sm transition-colors hover:text-foreground"
					to="/groups/$groupId"
					params={{ groupId }}
				>
					All members &rsaquo;
				</Link>
			</div>

			<div className="mt-2 flex flex-col divide-y divide-border">
				{isLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
						<div key={i} className="flex items-center gap-3 py-3">
							<Skeleton className="size-7 shrink-0 rounded-full" />
							<Skeleton className="h-3.5 flex-1" />
							<Skeleton className="h-3 w-10 shrink-0" />
						</div>
					))
				) : events.length === 0 ? (
					<p className="py-6 text-center text-muted-foreground text-sm">
						No recent activity.
					</p>
				) : (
					events.map((event, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: events have no unique id
						<EventRow key={`${event.type}-${event.userId}-${i}`} event={event} />
					))
				)}
			</div>
		</div>
	)
}
