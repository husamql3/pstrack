import { IconArrowLeft, IconLock, IconWorld } from "@tabler/icons-react"
import { Link, Outlet, useParams } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useGroup } from "../hooks/use-group"

export const GroupLayout = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const groupQuery = useGroup(groupId)

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
	const isAdmin = group.userRole === "ADMIN"

	return (
		<div className="flex flex-col gap-6">
			<div>
				<Link
					className="flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
					to="/groups"
				>
					<IconArrowLeft className="size-4" />
					All groups
				</Link>
				<div className="mt-3 flex flex-wrap items-center gap-3">
					<h1 className="font-semibold text-3xl tracking-tight">{group.name}</h1>
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
				{group.description && (
					<p className="mt-2 text-muted-foreground text-sm">{group.description}</p>
				)}
			</div>

			<nav className="flex gap-1">
				<GroupNavLink groupId={groupId} path="">
					Overview
				</GroupNavLink>
				<GroupNavLink groupId={groupId} path="/members">
					Members
				</GroupNavLink>
				{isAdmin && group.type === "PUBLIC" && (
					<GroupNavLink groupId={groupId} path="/join-requests">
						Join Requests
					</GroupNavLink>
				)}
				{isAdmin && (
					<GroupNavLink groupId={groupId} path="/settings">
						Settings
					</GroupNavLink>
				)}
			</nav>

			<Outlet />
		</div>
	)
}

const GroupNavLink = ({
	groupId,
	path,
	children,
}: {
	groupId: string
	path: string
	children: ReactNode
}) => {
	const isOverview = path === ""
	return (
		<Link
			activeOptions={{ exact: isOverview }}
			activeProps={{ className: "bg-muted text-foreground" }}
			className={cn(
				"rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
				"text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
			// @ts-expect-error — dynamic group routes not in literal union
			to={`/groups/${groupId}${path}`}
		>
			{children}
		</Link>
	)
}
