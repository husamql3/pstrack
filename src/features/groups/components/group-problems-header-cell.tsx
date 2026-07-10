import { Link } from "@tanstack/react-router"

import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import { cn } from "@/lib/utils"
import type { GroupProblemsMember } from "@/server/groups/groups.type"

export const GroupProblemsHeaderCell = ({
	member,
	isCurrentUser,
}: {
	member: GroupProblemsMember
	isCurrentUser: boolean
}) => {
	const label = member.username ?? member.name
	const inner = (
		<>
			<div className="relative">
				<HashAvatar
					username={label}
					size={28}
					shape="circle"
					isPro={member.isPro}
					proStar={member.isPro}
				/>
			</div>
			<div
				className="grow text-center font-medium text-[11px] tracking-wide"
				style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
				title={label}
			>
				{label}
			</div>
			<div className="text-[10px] text-muted-foreground tabular-nums">
				{member.solvedInRange}/{member.totalAssignedInRange}
			</div>
		</>
	)

	const containerClass = cn(
		"relative flex h-full w-full flex-col items-center gap-2 py-2",
		isCurrentUser && "ring-2 ring-primary/60 ring-inset"
	)

	if (member.username) {
		return (
			<Link
				to="/$username"
				params={{ username: member.username }}
				target="_blank"
				rel="noreferrer"
				className={cn(
					containerClass,
					"cursor-pointer transition-colors hover:bg-muted/50"
				)}
			>
				{inner}
			</Link>
		)
	}

	return <div className={containerClass}>{inner}</div>
}
