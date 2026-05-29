import { IconArrowLeft, IconLock, IconWorld } from "@tabler/icons-react"
import { Link, Outlet, useNavigate, useParams } from "@tanstack/react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Route as GroupRoute } from "@/routes/_authenticated/_app/groups_/$groupId"
import type { GroupProblemsRange } from "@/server/groups/groups.type"
import { useGroup } from "../hooks/use-group"
import { GroupProblemsTabs } from "./group-problems-tabs"

export const GroupLayout = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const groupQuery = useGroup(groupId)
	const { range } = GroupRoute.useSearch()
	const navigate = useNavigate()

	const setRange = (next: GroupProblemsRange) =>
		navigate({
			to: "/groups/$groupId",
			params: { groupId },
			search: { range: next },
		})

	if (groupQuery.isLoading) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-32 w-full" />
			</div>
		)
	}

	if (groupQuery.isError || !groupQuery.data) {
		return (
			<div className="rounded-lg border border-border bg-background p-6">
				<p className="font-medium text-sm">Group not found.</p>
				<Button asChild className="mt-4" variant="outline">
					<Link to="/groups">Back to groups</Link>
				</Button>
			</div>
		)
	}

	const group = groupQuery.data

	return (
		<div className="flex h-full flex-col gap-4">
			<div className="shrink-0">
				<Link
					className="flex items-center gap-1.5 w-fit text-muted-foreground text-sm transition-colors hover:text-foreground"
					to="/groups"
				>
					<IconArrowLeft className="size-4" />
					All groups
				</Link>
				<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="font-semibold text-3xl tracking-tight">@{group.slug}</h1>
						<Badge variant="outline">
							{group._count.members}/{group.maxMembers}
						</Badge>
						<Badge variant="secondary">
							{group.type === "PRIVATE" ? (
								<>
									<IconLock className="mr-1 size-3" />
									Private
								</>
							) : (
								<>
									<IconWorld className="mr-1 size-3" />
									Public
								</>
							)}
						</Badge>
					</div>
					<GroupProblemsTabs range={range} onChange={setRange} />
				</div>
			</div>

			<Outlet />
		</div>
	)
}
