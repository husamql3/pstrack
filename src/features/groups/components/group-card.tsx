import { IconCheck, IconLock } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { renderHashvatar } from "hashvatar"
import { useEffect, useRef } from "react"

import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
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
			className="relative flex size-6 shrink-0 overflow-hidden rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten"
		>
			<canvas ref={canvasRef} width={24} height={24} className="size-full" />
		</div>
	)
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

const MemberProgress = ({ count, max }: { count: number; max: number }) => {
	const pct = Math.min(Math.round((count / max) * 100), 100)
	return (
		<div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
			<div
				className="h-full rounded-full bg-emerald-500 transition-all"
				style={{ width: `${pct}%` }}
			/>
		</div>
	)
}

// ─── Type badge ────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: GroupType }) => {
	if (type === GroupType.PRIVATE) {
		return (
			<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-400">
				<IconLock className="size-2.5" />
				Private
			</span>
		)
	}
	return (
		<span className="inline-flex shrink-0 items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
			Public
		</span>
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
	const { membershipStatus } = group
	const memberCount = group._count.members
	const isMember = membershipStatus === "JOINED"
	const isPrivateNonMember =
		group.type === GroupType.PRIVATE && membershipStatus === "NONE"
	const isFull = memberCount >= group.maxMembers
	const overflow = memberCount - group.memberPreview.length

	return (
		<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
			{/* Header: icon + name + badge */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2.5">
					<HashAvatar username={group.slug} size={40} shape="square" />
					<p className="truncate font-semibold leading-tight">@{group.slug}</p>
				</div>
				<TypeBadge type={group.type} />
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
					<span className="flex items-center gap-1 text-xs font-medium text-emerald-500">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						{group.activeToday} active today
					</span>
				)}
			</div>

			{/* Progress bar */}
			<MemberProgress count={memberCount} max={group.maxMembers} />

			{/* Actions */}
			<div className="flex gap-2">
				{isMember ? (
					<>
						<Button variant="outline" className="flex-1" disabled>
							<IconCheck className="size-3.5" />
							Joined
						</Button>
						<Button asChild variant="outline">
							<Link to="/groups/$groupId" params={{ groupId: group.id }}>
								View
							</Link>
						</Button>
					</>
				) : isPrivateNonMember ? (
					<Button variant="outline" className="flex-1" disabled>
						<IconLock className="size-3.5" />
						Invite only
					</Button>
				) : membershipStatus === "REQUESTED" ? (
					<>
						<Button variant="outline" className="flex-1" disabled>
							Requested
						</Button>
						<Button asChild variant="outline">
							<Link to="/groups/$groupId" params={{ groupId: group.id }}>
								View
							</Link>
						</Button>
					</>
				) : (
					<>
						<Button
							className={cn(
								"flex-1",
								!isFull &&
									"bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700"
							)}
							disabled={isFull || isJoining}
							onClick={() => void onJoin(group.id)}
						>
							{isFull ? "Full" : "+ Join"}
						</Button>
						<Button asChild variant="outline">
							<Link to="/groups/$groupId" params={{ groupId: group.id }}>
								View
							</Link>
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
