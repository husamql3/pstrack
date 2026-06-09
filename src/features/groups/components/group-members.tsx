import { IconCrown, IconFlame, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useGroup, useGroupMembers, useRemoveMember } from "../hooks/use-group"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const GroupMembers = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const groupQuery = useGroup(groupId)
	const membersQuery = useGroupMembers(groupId)
	const removeMember = useRemoveMember(groupId)

	const isAdmin = groupQuery.data?.userRole === "ADMIN"

	const handleRemove = async (userId: string, name: string) => {
		await sileo.promise(removeMember.mutateAsync(userId), {
			loading: { title: `Removing ${name}...` },
			success: { title: `${name} removed` },
			error: (err: unknown) => ({
				title: "Could not remove member",
				description: errorDescription(err),
			}),
		})
	}

	if (membersQuery.isLoading) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		)
	}

	const members = membersQuery.data ?? []

	return (
		<div className="flex flex-col gap-3">
			{members.length === 0 && (
				<div className="rounded-lg border border-border bg-background p-6 text-center">
					<p className="text-muted-foreground text-sm">No members yet.</p>
				</div>
			)}

			{members.map((member) => (
				<div
					className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
					key={member.id}
				>
					<div className="flex items-center gap-3">
						<div>
							<div className="flex items-center gap-2">
								<span className="font-medium text-sm">
									{member.user.username ?? member.user.name}
								</span>
								{member.role === "ADMIN" && (
									<Badge className="gap-1" variant="secondary">
										<IconCrown className="size-3" />
										Admin
									</Badge>
								)}
							</div>
							<div className="mt-0.5 flex items-center gap-3 text-muted-foreground text-xs">
								<span>{member.user.totalPoints} pts</span>
								<span className="flex items-center gap-1">
									<IconFlame className="size-3" />
									{member.user.currentStreak}d streak
								</span>
							</div>
						</div>
					</div>

					{isAdmin && member.role !== "ADMIN" && (
						<Button
							disabled={removeMember.isPending}
							onClick={() =>
								handleRemove(member.user.id, member.user.username ?? member.user.name)
							}
							size="sm"
							variant="ghost"
						>
							<IconTrash className="size-4 text-destructive" />
						</Button>
					)}
				</div>
			))}
		</div>
	)
}
