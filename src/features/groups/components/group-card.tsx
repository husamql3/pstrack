import { IconCheck, IconLock } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { renderHashvatar } from "hashvatar"
import { useEffect, useRef } from "react"

import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import {
	ROADMAP_SHORT,
	ROADMAP_TONE,
	ROADMAP_TOTALS,
	TOPIC_TONE,
	TOPIC_TONE_FALLBACK,
} from "@/features/problems/constants"
import { GroupType } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import type { GroupListResponse } from "@/server/groups/groups.type"

// ─── Member avatar (hashvatar canvas in AvatarGroup-compatible wrapper) ────────

const MemberAvatar = ({ username }: { username: string | null }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const name = username ?? "?"

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const stop = renderHashvatar(canvas, {
			hash: name,
			size: 24,
			mode: "gradient",
			animated: false,
		})
		return stop
	}, [name])

	return (
		<div
			data-slot="avatar"
			className="relative flex size-6 shrink-0 select-none overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
		>
			<canvas ref={canvasRef} width={24} height={24} className="size-full" />
		</div>
	)
}

// ─── Roadmap progress ──────────────────────────────────────────────────────────

const RoadmapProgress = ({
	roadmap,
	roadmapIndex,
}: {
	roadmap: GroupListResponse["roadmap"]
	roadmapIndex: number
}) => {
	const total = ROADMAP_TOTALS[roadmap]
	if (!total) return null
	const current = Math.min(roadmapIndex, total)
	const pct = Math.min(Math.round((current / total) * 100), 100)
	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center justify-between text-[10px] text-muted-foreground">
				<Badge
					variant="outline"
					className={cn("h-4 px-1.5 text-[10px]", ROADMAP_TONE[roadmap])}
				>
					{ROADMAP_SHORT[roadmap]}
				</Badge>
				<span>
					{current}/{total}
				</span>
			</div>

			<div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-emerald-500 transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}

// ─── Membership / type badge ──────────────────────────────────────────────────
// Header right-column status chip. User-state (JOINED, REQUESTED) takes
// precedence over group-state (Public/Private) - once you're in, the
// public/private distinction is no longer the actionable label.

const MembershipBadge = ({
	type,
	membershipStatus,
}: {
	type: GroupType
	membershipStatus: GroupListResponse["membershipStatus"]
}) => {
	if (membershipStatus === "JOINED") {
		return (
			<Badge
				variant="outline"
				className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-400"
			>
				<IconCheck />
				Joined
			</Badge>
		)
	}
	if (membershipStatus === "REQUESTED") {
		return (
			<Badge variant="outline" className="bg-muted text-muted-foreground">
				Requested
			</Badge>
		)
	}
	if (type === GroupType.PRIVATE) {
		return (
			<Badge
				variant="outline"
				className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400"
			>
				<IconLock />
				Private
			</Badge>
		)
	}
	return (
		<Badge variant="outline" className="text-muted-foreground">
			Public
		</Badge>
	)
}

// ─── Action row (non-members only) ─────────────────────────────────────────────

const ActionRow = ({
	group,
	onJoin,
	isJoining,
}: {
	group: GroupListResponse
	onJoin: (groupId: string) => Promise<void>
	isJoining: boolean
}) => {
	const isFull = group._count.members >= group.maxMembers

	if (group.type === GroupType.PRIVATE) {
		return (
			<Button variant="outline" className="w-full" disabled>
				<IconLock className="size-3.5" />
				Invite only
			</Button>
		)
	}

	if (isFull) {
		return (
			<Button variant="outline" className="w-full" disabled>
				Full
			</Button>
		)
	}

	return (
		<Button
			className="w-full bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
			disabled={isJoining}
			onClick={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void onJoin(group.id)
			}}
		>
			+ Join
		</Button>
	)
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export const GroupCard = ({
	group,
	onJoin,
	isJoining,
}: {
	group: GroupListResponse
	onJoin: (groupId: string) => Promise<void>
	isJoining: boolean
}) => {
	const memberCount = group._count.members
	const overflow = memberCount - group.memberPreview.length
	const isNonMember = group.membershipStatus === "NONE"
	// Private groups the user isn't in have no viewable destination - skip the
	// stretched-link overlay so the card is inert (no navigation, no hover lift).
	const isLinked = !(isNonMember && group.type === GroupType.PRIVATE)

	return (
		// Stretched-link pattern: the <Link> absolutely fills the card so the whole
		// surface is clickable, while the inner <Button> sits in a `relative`
		// wrapper to paint above it and own its own click target.
		<div
			className={cn(
				"relative flex flex-col gap-3 rounded-xl border p-4 transition-colors",
				group.membershipStatus === "JOINED"
					? "border-emerald-500/40 dark:border-emerald-500/30"
					: "border-border",
				isLinked && "hover:border-foreground/20"
			)}
		>
			{isLinked && (
				<Link
					to="/groups/$groupId"
					params={{ groupId: group.id }}
					aria-label={`View @${group.slug}`}
					className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				/>
			)}

			{/* Header: icon + name + badges */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2.5">
					<HashAvatar username={group.slug} size={40} shape="square" />
					<p className="truncate font-semibold leading-tight">@{group.slug}</p>
				</div>
				<div className="flex shrink-0 flex-col items-end gap-1.5">
					<MembershipBadge type={group.type} membershipStatus={group.membershipStatus} />
					{group.currentProblem && (
						<Badge
							variant="outline"
							className={cn(
								"truncate",
								TOPIC_TONE[group.currentProblem.topic] ?? TOPIC_TONE_FALLBACK
							)}
						>
							{group.currentProblem.topic}
						</Badge>
					)}
					{!group.isStarted && (
						<Badge variant="outline" className="bg-muted text-muted-foreground">
							Not started
						</Badge>
					)}
				</div>
			</div>

			{/* Stats: avatars + count + active today */}
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<AvatarGroup>
						{group.memberPreview.map((m, i) => (
							<MemberAvatar key={m.username ?? i} username={m.username} />
						))}
						{overflow > 0 && (
							<AvatarGroupCount className="text-[10px]">+{overflow}</AvatarGroupCount>
						)}
					</AvatarGroup>
					<span className="text-muted-foreground text-xs">
						{memberCount}/{group.maxMembers}
					</span>
				</div>

				{group.activeToday > 0 && (
					<span className="flex items-center gap-1 font-medium text-emerald-500 text-xs">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						{group.activeToday} active today
					</span>
				)}
			</div>

			{/* Roadmap progress */}
			<RoadmapProgress roadmap={group.roadmap} roadmapIndex={group.roadmapIndex} />

			{/* Action row: only for non-members. Wrapped in `relative` so the Button
			    paints above the absolute Link overlay and captures its own clicks. */}
			{isNonMember && (
				<div className="relative">
					<ActionRow group={group} onJoin={onJoin} isJoining={isJoining} />
				</div>
			)}
		</div>
	)
}
