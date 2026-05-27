import { IconCheck, IconClock, IconX } from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useJoinRequests, useUpdateJoinRequest } from "../hooks/use-group"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const GroupJoinRequests = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const requestsQuery = useJoinRequests(groupId)
	const updateRequest = useUpdateJoinRequest(groupId)

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

	if (requestsQuery.isLoading) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-14 w-full" />
				<Skeleton className="h-14 w-full" />
			</div>
		)
	}

	const requests = requestsQuery.data ?? []

	if (requests.length === 0) {
		return (
			<div className="rounded-lg border border-border bg-background p-6 text-center">
				<IconClock className="mx-auto size-6 text-muted-foreground" />
				<p className="mt-2 font-medium text-sm">No pending requests</p>
				<p className="mt-1 text-muted-foreground text-sm">
					New requests will appear here for review.
				</p>
			</div>
		)
	}

	return (
		<div className="flex flex-col gap-3">
			{requests.map((req) => (
				<div
					className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
					key={req.id}
				>
					<div>
						<p className="font-medium text-sm">{req.user.username ?? req.user.name}</p>
						<p className="mt-0.5 text-muted-foreground text-xs">
							Requested {new Date(req.createdAt).toLocaleDateString()} · Expires{" "}
							{new Date(req.expiresAt).toLocaleDateString()}
						</p>
					</div>

					<div className="flex gap-2">
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
				</div>
			))}
		</div>
	)
}
