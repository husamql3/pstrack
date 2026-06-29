import { IconLock, IconTrophy } from "@tabler/icons-react"
import { Link, useNavigate, useSearch } from "@tanstack/react-router"
import { useCallback } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMe } from "@/features/settings/hooks/use-me"
import { cn } from "@/lib/utils"
import { useGlobalLeaderboard } from "../hooks/use-global-leaderboard"
import { useGroupLeaderboard } from "../hooks/use-group-leaderboard"
import { useMyGroups } from "../hooks/use-my-groups"
import { type LeaderboardMode, type LeaderboardPeriod, PERIODS } from "../types"
import { LeaderboardTable } from "./leaderboard-table"

// ─── Mode toggle (Group / Global) ─────────────────────────────────────────────

const ModeToggle = ({
	mode,
	onChange,
}: {
	mode: LeaderboardMode
	onChange: (m: LeaderboardMode) => void
}) => (
	<Tabs
		value={mode}
		onValueChange={(v) => {
			if (v === "group" || v === "global") onChange(v)
		}}
	>
		<TabsList variant="ghost">
			<TabsTrigger value="group">Group</TabsTrigger>
			<TabsTrigger value="global">Global</TabsTrigger>
		</TabsList>
	</Tabs>
)

// ─── Period tabs (Week / Month / All-time) ─────────────────────────────────────

const PeriodTabs = ({
	period,
	onChange,
}: {
	period: LeaderboardPeriod
	onChange: (p: LeaderboardPeriod) => void
}) => (
	<Tabs
		value={period}
		onValueChange={(v) => {
			const next = PERIODS.find((p) => p.value === v)?.value
			if (next) onChange(next)
		}}
	>
		<TabsList variant="ghost">
			{PERIODS.map((p) => (
				<TabsTrigger key={p.value} value={p.value}>
					{p.label}
				</TabsTrigger>
			))}
		</TabsList>
	</Tabs>
)

// ─── Group selector ────────────────────────────────────────────────────────────

const GroupSelector = ({
	groups,
	activeGroupId,
	onSelect,
}: {
	groups: { id: string; slug: string }[]
	activeGroupId: string | undefined
	onSelect: (id: string) => void
}) => {
	if (groups.length <= 1) return null
	return (
		<div className="flex flex-wrap gap-2">
			{groups.map((g) => (
				<button
					key={g.id}
					type="button"
					onClick={() => onSelect(g.id)}
					className={cn(
						"rounded-full border px-3 py-1 font-medium text-xs transition-colors",
						activeGroupId === g.id
							? "border-primary bg-primary/10 text-primary"
							: "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
					)}
				>
					{g.slug}
				</button>
			))}
		</div>
	)
}

// ─── Pro gate ─────────────────────────────────────────────────────────────────

const ProGate = () => (
	<div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-background p-12 text-center">
		<div className="flex size-12 items-center justify-center rounded-full bg-muted">
			<IconLock className="size-5 text-muted-foreground" />
		</div>
		<div>
			<p className="font-semibold text-base">Global Leaderboard is Pro only</p>
			<p className="mt-1 text-muted-foreground text-sm">
				Upgrade to Pro to see the top 100 solvers worldwide.
			</p>
		</div>
		<Button asChild size="sm">
			<Link to="/settings/account">Upgrade to Pro</Link>
		</Button>
	</div>
)

// ─── No group state ───────────────────────────────────────────────────────────

const NoGroupState = () => (
	<div className="rounded-xl border border-border bg-background p-8 text-center">
		<IconTrophy className="mx-auto mb-3 size-8 text-muted-foreground" />
		<p className="font-medium text-sm">You're not in any group yet.</p>
		<p className="mt-1 text-muted-foreground text-sm">
			Join a group to see its leaderboard.
		</p>
		<Button asChild className="mt-4" size="sm">
			<Link to="/groups">Browse groups</Link>
		</Button>
	</div>
)

// ─── Group leaderboard section ────────────────────────────────────────────────

const GroupLeaderboardSection = ({
	groups,
	period,
	activeGroupId,
	onGroupChange,
	viewerUserId,
}: {
	groups: { id: string; slug: string }[]
	period: LeaderboardPeriod
	activeGroupId: string | undefined
	onGroupChange: (id: string) => void
	viewerUserId: string | null | undefined
}) => {
	const { data, isLoading } = useGroupLeaderboard(activeGroupId, period)

	if (groups.length === 0) return <NoGroupState />

	return (
		<div className="flex flex-col gap-4">
			<GroupSelector
				groups={groups}
				activeGroupId={activeGroupId}
				onSelect={onGroupChange}
			/>
			<LeaderboardTable
				entries={data?.entries ?? []}
				viewerUserId={viewerUserId}
				isLoading={isLoading}
			/>
		</div>
	)
}

// ─── Global leaderboard section ───────────────────────────────────────────────

const GlobalLeaderboardSection = ({
	period,
	isPro,
	viewerUserId,
}: {
	period: LeaderboardPeriod
	isPro: boolean
	viewerUserId: string | null | undefined
}) => {
	const { data, isLoading } = useGlobalLeaderboard(period, isPro)

	if (!isPro) return <ProGate />

	return (
		<LeaderboardTable
			entries={data?.entries ?? []}
			viewerUserId={viewerUserId}
			isLoading={isLoading}
		/>
	)
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type LeaderboardSearch = {
	mode?: LeaderboardMode
	period?: LeaderboardPeriod
	groupId?: string
}

export const LeaderboardPage = () => {
	const navigate = useNavigate({ from: "/leaderboard" })
	const search = useSearch({ from: "/leaderboard" }) as LeaderboardSearch

	const mode: LeaderboardMode = search.mode ?? "group"
	const period: LeaderboardPeriod = search.period ?? "week"

	const meQuery = useMe()
	const groupsQuery = useMyGroups()

	const groups = groupsQuery.data ?? []
	const activeGroupId = search.groupId ?? (groups.length > 0 ? groups[0]?.id : undefined)

	const setMode = useCallback(
		(m: LeaderboardMode) => {
			navigate({ search: (prev: LeaderboardSearch) => ({ ...prev, mode: m }) })
		},
		[navigate]
	)

	const setPeriod = useCallback(
		(p: LeaderboardPeriod) => {
			navigate({ search: (prev: LeaderboardSearch) => ({ ...prev, period: p }) })
		},
		[navigate]
	)

	const setGroupId = useCallback(
		(id: string) => {
			navigate({ search: (prev: LeaderboardSearch) => ({ ...prev, groupId: id }) })
		},
		[navigate]
	)

	const me = meQuery.data
	const viewerUserId = me?.id

	// Subtitle for group view
	const activeGroup = groups.find((g) => g.id === activeGroupId)
	const groupData = useGroupLeaderboard(activeGroupId, period)
	const memberCount = groupData.data?.memberCount

	const subtitle =
		mode === "group" && activeGroup
			? [period, "group", memberCount !== undefined ? `${memberCount} members` : null]
					.filter(Boolean)
					.join(" · ")
			: mode === "global"
				? `${period} · global · top 100`
				: null

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">Leaderboard</h1>
					{subtitle && <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>}
					{groupsQuery.isLoading && <Skeleton className="mt-1 h-4 w-40" />}
				</div>
				<ModeToggle mode={mode} onChange={setMode} />
			</div>

			{/* Period tabs */}
			<PeriodTabs period={period} onChange={setPeriod} />

			{/* Content */}
			{mode === "group" ? (
				<GroupLeaderboardSection
					groups={groups}
					period={period}
					activeGroupId={activeGroupId}
					onGroupChange={setGroupId}
					viewerUserId={viewerUserId}
				/>
			) : (
				<GlobalLeaderboardSection
					period={period}
					isPro={me?.isPro ?? false}
					viewerUserId={viewerUserId}
				/>
			)}
		</div>
	)
}
