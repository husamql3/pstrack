import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo, useState } from "react"
import { sileo } from "sileo"
import { z } from "zod"

import { Skeleton } from "@/components/ui/skeleton"
import { GroupCard } from "@/features/groups/components/group-card"
import { GroupFilterRow } from "@/features/groups/components/group-filter-row"
import { GroupsHeader } from "@/features/groups/components/groups-header"
import { useGroups, useRequestJoinGroup } from "@/features/groups/hooks/use-groups"
import type { TypeFilter } from "@/features/groups/types"
import { ProFeatureError } from "@/lib/errors"

// ─── Search params ─────────────────────────────────────────────────────────────

const searchSchema = z.object({
	q: z
		.string()
		.optional()
		.transform((val) => val?.trim().toLowerCase()),
	type: z.enum(["all", "public", "private"]).optional().default("all"),
})

export const Route = createFileRoute("/_authenticated/_app/groups")({
	validateSearch: searchSchema,
	component: GroupsPage,
})

// ─── Skeleton card ─────────────────────────────────────────────────────────────

const GroupCardSkeleton = () => (
	<div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
		<div className="flex items-start justify-between gap-2">
			<div className="flex items-center gap-2.5">
				<Skeleton className="size-10 rounded-xl" />
				<Skeleton className="h-3.5 w-28" />
			</div>
			<Skeleton className="h-5 w-12 rounded-full" />
		</div>
		<Skeleton className="h-3 w-full" />
		<Skeleton className="h-3 w-3/4" />
		<div className="flex items-center justify-between">
			<Skeleton className="h-6 w-24" />
			<Skeleton className="h-3 w-20" />
		</div>
		<Skeleton className="h-[3px] w-full rounded-full" />
		<div className="flex gap-2">
			<Skeleton className="h-8 flex-1 rounded-md" />
			<Skeleton className="h-8 w-14 rounded-md" />
		</div>
	</div>
)

// ─── Page ─────────────────────────────────────────────────────────────────────

function GroupsPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const { q, type } = Route.useSearch()

	const groupsQuery = useGroups()
	const requestJoin = useRequestJoinGroup()

	const [filterQuery, setFilterQuery] = useState(q ?? "")

	const handleTypeChange = useCallback(
		(t: TypeFilter) => void navigate({ search: (prev) => ({ ...prev, type: t }) }),
		[navigate]
	)

	const handleQueryChange = useCallback(
		(term: string) => {
			setFilterQuery(term)
			void navigate({ search: (prev) => ({ ...prev, q: term || undefined }) })
		},
		[navigate]
	)

	const handleJoin = useCallback(
		async (groupId: string) => {
			await sileo.promise(requestJoin.mutateAsync(groupId), {
				loading: { title: "Requesting to join..." },
				success: { title: "Join request sent!" },
				error: (err: unknown) => {
					if (err instanceof ProFeatureError) {
						return {
							title: "Pro feature",
							description: "Joining multiple groups requires a Pro account.",
							button: {
								title: "Upgrade to Pro",
								onClick: () => void navigate({ to: "/settings/billing" }),
							},
						}
					}
					return {
						title: "Could not request access",
						description: err instanceof Error ? err.message : "Please try again.",
					}
				},
			})
		},
		[requestJoin, navigate]
	)

	// filterQuery mirrors the URL `q` param but updates synchronously from the
	// debounced callback so client-side filtering doesn't lag behind URL round-trips.
	const searchTrim = filterQuery.trim().toLowerCase()

	const { mine, discovery } = useMemo(() => {
		const list = groupsQuery.data ?? []
		const filtered = list.filter((g) => {
			if (type === "public" && g.type !== "PUBLIC") return false
			if (type === "private" && g.type !== "PRIVATE") return false
			if (searchTrim) {
				return g.slug.toLowerCase().includes(searchTrim)
			}
			return true
		})
		// JOINED first, then REQUESTED. Within each bucket, server order
		// (member count desc, createdAt asc) is preserved.
		const mine = filtered
			.filter((g) => g.membershipStatus !== "NONE")
			.sort((a, b) =>
				a.membershipStatus === b.membershipStatus
					? 0
					: a.membershipStatus === "JOINED"
						? -1
						: 1
			)
		const discovery = filtered.filter((g) => g.membershipStatus === "NONE")
		return { mine, discovery }
	}, [groupsQuery.data, type, searchTrim])

	const stats = useMemo(() => {
		const list = groupsQuery.data ?? []
		return {
			total: list.length,
			developers: list.reduce((sum, g) => sum + g._count.members, 0),
			joined: list.filter((g) => g.membershipStatus === "JOINED").length,
		}
	}, [groupsQuery.data])

	return (
		<div className="space-y-4">
			<GroupsHeader
				total={stats.total}
				developers={stats.developers}
				joined={stats.joined}
			/>

			<GroupFilterRow
				initialQuery={q ?? ""}
				type={type}
				onQueryChange={handleQueryChange}
				onTypeChange={handleTypeChange}
			/>

			<div className="space-y-8 pb-12">
				{groupsQuery.isPending ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items have no stable id
							<GroupCardSkeleton key={i} />
						))}
					</div>
				) : (
					<>
						{mine.length > 0 && (
							<div className="space-y-3">
								<h2 className="font-semibold text-sm">Your Groups</h2>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{mine.map((group) => (
										<GroupCard
											key={group.id}
											group={group}
											onJoin={handleJoin}
											isJoining={requestJoin.isPending}
										/>
									))}
								</div>
							</div>
						)}
						{discovery.length > 0 && (
							<div className="space-y-3">
								<h2 className="font-semibold text-sm">
									{mine.length > 0 ? "Discover" : "All Groups"}
								</h2>
								<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{discovery.map((group) => (
										<GroupCard
											key={group.id}
											group={group}
											onJoin={handleJoin}
											isJoining={requestJoin.isPending}
										/>
									))}
								</div>
							</div>
						)}
						{mine.length === 0 && discovery.length === 0 && (
							<div className="py-16 text-center">
								<p className="font-medium text-sm">No groups found</p>
								<p className="mt-1 text-muted-foreground text-sm">
									Try adjusting your search or filter.
								</p>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
