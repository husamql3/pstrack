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
				error: (err: unknown) => ({
					title: "Could not request access",
					description: err instanceof Error ? err.message : "Please try again.",
				}),
			})
		},
		[requestJoin]
	)

	// filterQuery mirrors the URL `q` param but updates synchronously from the
	// debounced callback so client-side filtering doesn't lag behind URL round-trips.
	const searchTrim = filterQuery.trim().toLowerCase()

	const filtered = useMemo(() => {
		const list = groupsQuery.data ?? []
		return list.filter((g) => {
			if (type === "public" && g.type !== "PUBLIC") return false
			if (type === "private" && g.type !== "PRIVATE") return false
			if (searchTrim) {
				return g.slug.toLowerCase().includes(searchTrim)
			}
			return true
		})
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

			<div className="pb-12">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{groupsQuery.isPending
						? Array.from({ length: 8 }).map((_, i) => <GroupCardSkeleton key={i} />)
						: filtered.map((group) => (
								<GroupCard
									key={group.id}
									group={group}
									onJoin={handleJoin}
									isJoining={requestJoin.isPending}
								/>
							))}
				</div>

				{!groupsQuery.isPending && filtered.length === 0 && (
					<div className="py-16 text-center">
						<p className="font-medium text-sm">No groups found</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Try adjusting your search or filter.
						</p>
					</div>
				)}
			</div>
		</div>
	)
}
