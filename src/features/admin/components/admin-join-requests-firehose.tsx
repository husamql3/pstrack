import { IconExternalLink } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

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
import { useAdminPendingRequests } from "../hooks/use-admin-group"
import { AdminEmpty } from "./admin-empty"
import { AdminPageHeader } from "./admin-page-header"

export const AdminJoinRequestsFirehose = () => {
	const { data, isLoading } = useAdminPendingRequests()

	return (
		<>
			<AdminPageHeader
				title="Join requests"
				description="Pending join requests across every group."
			/>

			{isLoading ? (
				<Skeleton className="h-64 w-full" />
			) : (data?.length ?? 0) === 0 ? (
				<AdminEmpty
					title="No pending requests"
					description="New requests will appear here for review."
				/>
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Group</TableHead>
								<TableHead className="hidden sm:table-cell">Requested</TableHead>
								<TableHead className="hidden sm:table-cell">Expires</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{(data ?? []).map((req) => (
								<TableRow key={req.id}>
									<TableCell className="font-medium">
										{req.user.username ?? req.user.name}
									</TableCell>
									<TableCell className="font-medium">@{req.group.slug}</TableCell>
									<TableCell className="hidden text-muted-foreground sm:table-cell">
										{new Date(req.createdAt).toLocaleDateString()}
									</TableCell>
									<TableCell className="hidden text-muted-foreground sm:table-cell">
										{new Date(req.expiresAt).toLocaleDateString()}
									</TableCell>
									<TableCell>
										<Button asChild size="sm" variant="outline">
											<Link
												params={{ groupId: req.groupId }}
												to="/admin/groups/$groupId/join-requests"
											>
												Review
												<IconExternalLink className="size-3" />
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</>
	)
}
