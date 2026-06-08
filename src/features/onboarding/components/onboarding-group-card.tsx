import { IconCheck } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ROADMAP_SHORT, ROADMAP_TONE } from "@/features/problems/constants"
import { cn } from "@/lib/utils"
import type { GroupListResponse } from "@/server/groups/groups.type"
import { HashAvatar } from "./hash-avatar"

export const OnboardingGroupCard = ({
	group,
	onJoin,
	isJoining,
}: {
	group: GroupListResponse
	onJoin: (groupId: string) => Promise<void>
	isJoining: boolean
}) => {
	const memberCount = group._count.members
	const isFull = memberCount >= group.maxMembers
	const isRequested = group.membershipStatus === "REQUESTED"

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border p-4">
			<div className="flex items-start gap-3">
				<HashAvatar username={group.slug} size={40} shape="square" />
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<p className="truncate font-semibold leading-tight">@{group.slug}</p>
					<div className="flex items-center gap-2 text-muted-foreground text-xs">
						<span>
							{memberCount}/{group.maxMembers}
						</span>
						<Badge
							variant="outline"
							className={cn("h-4 px-1.5 text-[10px]", ROADMAP_TONE[group.roadmap])}
						>
							{ROADMAP_SHORT[group.roadmap]}
						</Badge>
					</div>
				</div>
			</div>

			{isRequested ? (
				<Button variant="outline" className="w-full" disabled>
					<IconCheck className="size-3.5" />
					Requested
				</Button>
			) : (
				<Button
					className="w-full bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
					disabled={isJoining || isFull}
					onClick={() => void onJoin(group.id)}
				>
					{isFull ? "Full" : "+ Join"}
				</Button>
			)}
		</div>
	)
}
