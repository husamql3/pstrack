import { IconCalendar, IconCrown, IconUsers } from "@tabler/icons-react"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useGroup, useLeaveGroup } from "../hooks/use-group"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const GroupOverview = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const groupQuery = useGroup(groupId)
	const navigate = useNavigate()
	const leaveGroup = useLeaveGroup(groupId)

	if (groupQuery.isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!groupQuery.data) return null

	const group = groupQuery.data
	const isMember = group.membershipStatus === "JOINED"
	const isAdmin = group.userRole === "ADMIN"

	const handleLeave = async () => {
		await sileo.promise(leaveGroup.mutateAsync(), {
			loading: { title: "Leaving group..." },
			success: { title: "Left group" },
			error: (err: unknown) => ({
				title: "Could not leave group",
				description: errorDescription(err),
			}),
		})
		navigate({ to: "/groups" })
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="grid gap-3 md:grid-cols-3">
				<div className="rounded-lg border border-border bg-background p-4">
					<p className="flex items-center gap-2 text-muted-foreground text-xs">
						<IconUsers className="size-3.5" />
						Members
					</p>
					<p className="mt-1 font-semibold text-lg">
						{group._count.members}/{group.maxMembers}
					</p>
				</div>
				<div className="rounded-lg border border-border bg-background p-4">
					<p className="flex items-center gap-2 text-muted-foreground text-xs">
						<IconCrown className="size-3.5" />
						Your role
					</p>
					<p className="mt-1 font-semibold text-lg capitalize">
						{group.userRole?.toLowerCase() ?? "—"}
					</p>
				</div>
				<div className="rounded-lg border border-border bg-background p-4">
					<p className="flex items-center gap-2 text-muted-foreground text-xs">
						<IconCalendar className="size-3.5" />
						Created
					</p>
					<p className="mt-1 font-semibold text-lg">
						{new Date(group.createdAt).toLocaleDateString()}
					</p>
				</div>
			</div>

			{isMember && !isAdmin && (
				<div className="flex justify-end">
					<Button
						disabled={leaveGroup.isPending}
						onClick={handleLeave}
						size="sm"
						variant="outline"
					>
						Leave group
					</Button>
				</div>
			)}

			{!isMember && (
				<div className="rounded-lg border border-border bg-background p-6 text-center">
					<p className="font-medium text-sm">You are not a member of this group.</p>
					<Button asChild className="mt-4">
						<Link to="/groups">Browse groups</Link>
					</Button>
				</div>
			)}

			{group.membershipStatus === "REQUESTED" && (
				<div className="rounded-lg border border-border bg-background p-4">
					<Badge variant="secondary">Request pending</Badge>
					<p className="mt-2 text-muted-foreground text-sm">
						Your request to join is pending admin approval.
					</p>
				</div>
			)}
		</div>
	)
}
