import { IconCrown, IconTrash } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useAdminGroupMembers, useAdminRemoveMember } from "../hooks/use-admin-group"
import { AdminEmpty } from "./admin-empty"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const AdminGroupMembers = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const { data, isLoading } = useAdminGroupMembers(groupId)
	const removeMember = useAdminRemoveMember(groupId)

	const handleRemove = async (userId: string, name: string) => {
		if (!confirm(`Remove ${name} from this group?`)) return
		await sileo.promise(removeMember.mutateAsync(userId), {
			loading: { title: `Removing ${name}...` },
			success: { title: `${name} removed` },
			error: (err: unknown) => ({
				title: "Could not remove member",
				description: errorDescription(err),
			}),
		})
	}

	if (isLoading) return <Skeleton className="h-48 w-full" />

	const members = data ?? []
	if (members.length === 0) return <AdminEmpty title="No members yet" />

	return (
		<div className="rounded-lg border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User</TableHead>
						<TableHead className="text-right">Points</TableHead>
						<TableHead className="hidden text-right sm:table-cell">Streak</TableHead>
						<TableHead className="hidden sm:table-cell">Joined</TableHead>
						<TableHead className="w-10" />
					</TableRow>
				</TableHeader>
				<TableBody>
					{members.map((member) => (
						<TableRow key={member.id}>
							<TableCell>
								<div className="flex items-center gap-2 font-medium">
									{member.user.username ?? member.user.name}
									{member.role === "ADMIN" && (
										<Badge className="gap-1" variant="secondary">
											<IconCrown className="size-3" />
											Creator
										</Badge>
									)}
								</div>
							</TableCell>
							<TableCell className="text-right tabular-nums">
								{member.user.totalPoints}
							</TableCell>
							<TableCell className="hidden text-right tabular-nums sm:table-cell">
								{member.user.currentStreak}d
							</TableCell>
							<TableCell className="hidden text-muted-foreground sm:table-cell">
								{new Date(member.joinedAt).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<Button
									disabled={removeMember.isPending}
									onClick={() =>
										handleRemove(member.user.id, member.user.username ?? member.user.name)
									}
									size="icon-sm"
									variant="ghost"
								>
									<IconTrash className="size-4 text-destructive" />
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
