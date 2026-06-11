import { IconCheck, IconX } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { sileo } from "sileo"

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
import {
	useAdminGroupJoinRequests,
	useAdminUpdateJoinRequest,
} from "../hooks/use-admin-group"
import { AdminEmpty } from "./admin-empty"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const AdminGroupJoinRequests = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const { data, isLoading } = useAdminGroupJoinRequests(groupId)
	const updateRequest = useAdminUpdateJoinRequest(groupId)

	const handleAction = async (requestId: string, action: "APPROVED" | "REJECTED") => {
		await sileo.promise(updateRequest.mutateAsync({ requestId, action }), {
			loading: { title: action === "APPROVED" ? "Approving..." : "Rejecting..." },
			success: {
				title: action === "APPROVED" ? "Request approved" : "Request rejected",
			},
			error: (err: unknown) => ({
				title: "Could not process request",
				description: errorDescription(err),
			}),
		})
	}

	if (isLoading) return <Skeleton className="h-48 w-full" />

	const requests = data ?? []
	if (requests.length === 0) {
		return (
			<AdminEmpty
				title="No pending requests"
				description="New requests will appear here for review."
			/>
		)
	}

	return (
		<div className="rounded-lg border bg-card">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>User</TableHead>
						<TableHead className="hidden sm:table-cell">Requested</TableHead>
						<TableHead className="hidden sm:table-cell">Expires</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{requests.map((req) => (
						<TableRow key={req.id}>
							<TableCell className="font-medium">
								{req.user.username ?? req.user.name}
							</TableCell>
							<TableCell className="hidden text-muted-foreground sm:table-cell">
								{new Date(req.createdAt).toLocaleDateString()}
							</TableCell>
							<TableCell className="hidden text-muted-foreground sm:table-cell">
								{new Date(req.expiresAt).toLocaleDateString()}
							</TableCell>
							<TableCell>
								<div className="flex justify-end gap-2">
									<Button
										disabled={updateRequest.isPending}
										onClick={() => handleAction(req.id, "REJECTED")}
										size="sm"
										variant="outline"
									>
										<IconX className="size-4" />
										Reject
									</Button>
									<Button
										disabled={updateRequest.isPending}
										onClick={() => handleAction(req.id, "APPROVED")}
										size="sm"
									>
										<IconCheck className="size-4" />
										Approve
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
