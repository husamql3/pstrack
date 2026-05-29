import { IconExternalLink } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
	DIFFICULTY_LABELS,
	DIFFICULTY_TONE,
	TOPIC_TONE,
	TOPIC_TONE_FALLBACK,
} from "@/features/problems/constants"
import { useSession } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Route as GroupRoute } from "@/routes/_authenticated/_app/groups_/$groupId"
import type {
	GroupProblemsMember,
	GroupProblemsRange,
	GroupProblemsRow,
} from "@/server/groups/groups.type"
import { HEADER_HEIGHT_PX, MEMBER_COL_WIDTH_PX, ROW_HEIGHT_PX } from "../constants"
import {
	useGroupProblems,
	useMarkTodaySolvedFromTable,
} from "../hooks/use-group-problems"
import { GroupProblemsCell } from "./group-problems-cell"
import { GroupProblemsHeaderCell } from "./group-problems-header-cell"

const META_COLS = [
	{ key: "date", label: "Date", width: 80 },
	{ key: "num", label: "#", width: 50 },
	{ key: "title", label: "Problem", width: 240 },
	{ key: "topic", label: "Topic", width: 140 },
	{ key: "difficulty", label: "Difficulty", width: 90 },
] as const

const META_WIDTH = META_COLS.reduce((sum, c) => sum + c.width, 0)
const META_LEFT: Record<string, number> = (() => {
	let acc = 0
	const map: Record<string, number> = {}
	for (const col of META_COLS) {
		map[col.key] = acc
		acc += col.width
	}
	return map
})()

const startOfTodayUtc = () => {
	const now = new Date()
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

const isSameUtcDay = (a: Date, b: Date) =>
	a.getUTCFullYear() === b.getUTCFullYear() &&
	a.getUTCMonth() === b.getUTCMonth() &&
	a.getUTCDate() === b.getUTCDate()

const formatDateCell = (date: Date, today: Date) => {
	if (isSameUtcDay(date, today)) {
		return {
			primary: "TODAY",
			secondary: date.toLocaleDateString(undefined, {
				weekday: "short",
				timeZone: "UTC",
			}),
			isToday: true,
		}
	}
	return {
		primary: date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			timeZone: "UTC",
		}),
		secondary: date.toLocaleDateString(undefined, {
			weekday: "short",
			timeZone: "UTC",
		}),
		isToday: false,
	}
}

export const GroupProblemsTable = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const { data: session } = useSession()
	const currentUserId = session?.user.id ?? null

	const { range } = GroupRoute.useSearch()
	const query = useGroupProblems(groupId, range)
	const solveMutation = useMarkTodaySolvedFromTable(groupId, range)

	const today = useMemo(() => startOfTodayUtc(), [])

	const [memberOrderByRange, setMemberOrderByRange] = useState<
		Partial<Record<GroupProblemsRange, string[]>>
	>({})

	useEffect(() => {
		if (query.isLoading || query.members.length === 0) return
		if (memberOrderByRange[range]) return
		const ordered = [...query.members]
			.sort((a, b) => b.solvedInRange - a.solvedInRange)
			.map((m) => m.userId)
		setMemberOrderByRange((prev) => ({ ...prev, [range]: ordered }))
	}, [range, query.isLoading, query.members, memberOrderByRange])

	const orderedMembers = useMemo<GroupProblemsMember[]>(() => {
		const order = memberOrderByRange[range]
		if (!order) return query.members
		const byId = new Map(query.members.map((m) => [m.userId, m]))
		const seen = new Set<string>()
		const out: GroupProblemsMember[] = []
		for (const id of order) {
			const m = byId.get(id)
			if (m) {
				out.push(m)
				seen.add(id)
			}
		}
		for (const m of query.members) if (!seen.has(m.userId)) out.push(m)
		return out
	}, [memberOrderByRange, range, query.members])

	const totalGridWidth = META_WIDTH + orderedMembers.length * MEMBER_COL_WIDTH_PX

	const scrollRef = useRef<HTMLDivElement>(null)
	const virtualizer = useVirtualizer({
		count: query.rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => ROW_HEIGHT_PX,
		overscan: 6,
	})

	const fetchNextPage = query.fetchNextPage
	const hasNextPage = query.hasNextPage
	const isFetchingNextPage = query.isFetchingNextPage
	const virtualItems = virtualizer.getVirtualItems()
	const lastIndex =
		virtualItems.length > 0 ? virtualItems[virtualItems.length - 1].index : -1

	useEffect(() => {
		if (range !== "all") return
		if (!hasNextPage || isFetchingNextPage) return
		if (lastIndex >= query.rows.length - 4) {
			fetchNextPage()
		}
	}, [
		range,
		hasNextPage,
		isFetchingNextPage,
		lastIndex,
		query.rows.length,
		fetchNextPage,
	])

	const handleSolve = useCallback(() => solveMutation.mutateAsync(), [solveMutation])

	return (
		<TooltipProvider>
			<div className="flex min-h-0 flex-1 flex-col">
				{query.isLoading ? (
					<TableSkeleton />
				) : query.isError ? (
					<div className="p-6">
						<p className="font-medium text-sm">Could not load problems.</p>
					</div>
				) : query.rows.length === 0 ? (
					<EmptyState />
				) : (
					<div
						ref={scrollRef}
						className="relative min-h-0 flex-1 overflow-auto bg-background"
					>
						<div style={{ width: totalGridWidth, position: "relative" }}>
							<HeaderRow
								members={orderedMembers}
								currentUserId={currentUserId}
								totalWidth={totalGridWidth}
							/>
							<div
								style={{
									height: virtualizer.getTotalSize(),
									position: "relative",
								}}
							>
								{virtualItems.map((item) => {
									const row = query.rows[item.index]
									return (
										<div
											key={row.dailyProblemId}
											style={{
												position: "absolute",
												top: item.start,
												left: 0,
												width: totalGridWidth,
												height: ROW_HEIGHT_PX,
											}}
										>
											<DataRow
												row={row}
												today={today}
												members={orderedMembers}
												currentUserId={currentUserId}
												onSolve={handleSolve}
												isSolvePending={solveMutation.isPending}
											/>
										</div>
									)
								})}
							</div>
							{range === "all" && isFetchingNextPage && (
								<div className="sticky left-0 flex w-full items-center justify-center py-3">
									<div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</TooltipProvider>
	)
}

const HeaderRow = ({
	members,
	currentUserId,
	totalWidth,
}: {
	members: GroupProblemsMember[]
	currentUserId: string | null
	totalWidth: number
}) => (
	<div
		className="sticky top-0 z-20 flex border-border border-b bg-background"
		style={{ height: HEADER_HEIGHT_PX, width: totalWidth }}
	>
		{META_COLS.map((col) => (
			<div
				key={col.key}
				className="sticky z-30 flex shrink-0 items-end border-border border-r bg-background px-3 pb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide"
				style={{ width: col.width, left: META_LEFT[col.key] }}
			>
				{col.label}
			</div>
		))}
		{members.map((m) => (
			<div
				key={m.userId}
				className="shrink-0 border-border border-r"
				style={{ width: MEMBER_COL_WIDTH_PX }}
			>
				<GroupProblemsHeaderCell member={m} isCurrentUser={m.userId === currentUserId} />
			</div>
		))}
	</div>
)

const DataRow = ({
	row,
	today,
	members,
	currentUserId,
	onSolve,
	isSolvePending,
}: {
	row: GroupProblemsRow
	today: Date
	members: GroupProblemsMember[]
	currentUserId: string | null
	onSolve: () => Promise<unknown>
	isSolvePending: boolean
}) => {
	const assignedDate = new Date(row.assignedDate)
	const isTodayRow = isSameUtcDay(assignedDate, today)
	const dateCell = formatDateCell(assignedDate, today)

	return (
		<div
			className={cn(
				"flex h-full border-border border-b",
				isTodayRow && "bg-emerald-500/[0.04]"
			)}
		>
			<div
				className="sticky z-10 flex shrink-0 flex-col justify-center border-border border-r bg-background px-3"
				style={{ width: META_COLS[0].width, left: META_LEFT.date }}
			>
				<span
					className={cn(
						"font-semibold text-sm tabular-nums",
						dateCell.isToday && "text-emerald-500"
					)}
				>
					{dateCell.primary}
				</span>
				<span className="text-muted-foreground text-xs">{dateCell.secondary}</span>
			</div>
			<div
				className="sticky z-10 flex shrink-0 items-center border-border border-r bg-background px-3 text-muted-foreground text-sm tabular-nums"
				style={{ width: META_COLS[1].width, left: META_LEFT.num }}
			>
				{row.problemRoadmapIndex}
			</div>
			<div
				className="sticky z-10 flex shrink-0 items-center border-border border-r bg-background px-3"
				style={{ width: META_COLS[2].width, left: META_LEFT.title }}
			>
				<a
					href={`https://leetcode.com/problems/${row.problemSlug}/`}
					target="_blank"
					rel="noreferrer"
					className="group inline-flex items-center gap-1.5 truncate font-medium text-sm hover:text-primary"
					title={row.problemTitle}
				>
					<span className="truncate">{row.problemTitle}</span>
					<IconExternalLink className="size-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
				</a>
			</div>
			<div
				className="sticky z-10 flex shrink-0 items-center border-border border-r bg-background px-3"
				style={{ width: META_COLS[3].width, left: META_LEFT.topic }}
			>
				<Badge
					variant="outline"
					className={cn("truncate", TOPIC_TONE[row.problemTopic] ?? TOPIC_TONE_FALLBACK)}
				>
					{row.problemTopic}
				</Badge>
			</div>
			<div
				className="sticky z-10 flex shrink-0 items-center border-border border-r bg-background px-3"
				style={{ width: META_COLS[4].width, left: META_LEFT.difficulty }}
			>
				<Badge variant="outline" className={DIFFICULTY_TONE[row.problemDifficulty]}>
					{DIFFICULTY_LABELS[row.problemDifficulty]}
				</Badge>
			</div>
			{members.map((m) => {
				const solve = row.solvesByUserId[m.userId] ?? null
				const memberJoinedAt = new Date(m.joinedAt)
				const isPreJoin =
					assignedDate < memberJoinedAt && !isSameUtcDay(assignedDate, memberJoinedAt)
				return (
					<div
						key={m.userId}
						className="shrink-0 border-border border-r"
						style={{ width: MEMBER_COL_WIDTH_PX }}
					>
						<GroupProblemsCell
							solve={solve}
							isTodayRow={isTodayRow}
							isOwnColumn={m.userId === currentUserId}
							isPreJoin={isPreJoin}
							isCurrentUser={m.userId === currentUserId}
							isPro={m.isPro}
							onSolve={onSolve}
							isSolvePending={isSolvePending}
						/>
					</div>
				)
			})}
		</div>
	)
}

const TableSkeleton = () => (
	<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden bg-background">
		<Skeleton className="w-full shrink-0" style={{ height: HEADER_HEIGHT_PX }} />
		{Array.from({ length: 10 }).map((_, i) => (
			<Skeleton
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
				key={i}
				className="w-full shrink-0"
				style={{ height: ROW_HEIGHT_PX }}
			/>
		))}
	</div>
)

const EmptyState = () => (
	<div className="flex flex-1 items-center justify-center p-6 text-center">
		<div>
			<p className="font-medium text-sm">No problems assigned yet.</p>
			<p className="mt-1 text-muted-foreground text-sm">
				The first problem arrives at midnight UTC.
			</p>
		</div>
	</div>
)
