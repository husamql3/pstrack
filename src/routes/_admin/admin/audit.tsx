import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { AdminEmpty } from "@/features/admin/components/admin-empty"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminAuditAction, AdminAuditTargetType } from "@/generated/prisma/enums"
import { api } from "@/lib/api"

const searchSchema = z.object({
	actor: z.string().optional(),
	action: z.enum(AdminAuditAction).optional(),
	targetType: z.enum(AdminAuditTargetType).optional(),
	targetId: z.string().optional(),
})

export const Route = createFileRoute("/_admin/admin/audit")({
	validateSearch: searchSchema,
	component: AdminAuditPage,
})

const ACTION_VARIANT: Partial<
	Record<
		keyof typeof AdminAuditAction,
		"default" | "destructive" | "secondary" | "outline"
	>
> = {
	USER_BANNED: "destructive",
	GROUP_DELETED: "destructive",
	PROBLEM_DELETED: "destructive",
	PRO_REVOKED: "destructive",
	USER_IMPERSONATED: "secondary",
	POINTS_ADJUSTED: "default",
	PRO_GRANTED: "default",
	FEATURE_FLAG_TOGGLED: "outline",
	SYSTEM_CONFIG_UPDATED: "outline",
	EMAIL_SENT: "outline",
}

function AdminAuditPage() {
	const search = Route.useSearch()

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "audit", search],
		queryFn: async () => {
			const { data, error } = await api.v3.admin.audit.get({
				query: {
					...(search.actor ? { actor: search.actor } : {}),
					...(search.action ? { action: search.action } : {}),
					...(search.targetType ? { targetType: search.targetType } : {}),
					...(search.targetId ? { targetId: search.targetId } : {}),
				},
			})
			if (error) throw new Error("Failed to load audit log")
			return data
		},
	})

	const items = data?.items ?? []

	return (
		<>
			<AdminPageHeader
				title="Audit log"
				description="Every admin mutation, immutable forever."
			/>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No audit entries yet" />
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="whitespace-nowrap">When</TableHead>
								<TableHead>Admin</TableHead>
								<TableHead>Action</TableHead>
								<TableHead>Target</TableHead>
								<TableHead>Metadata</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="whitespace-nowrap text-muted-foreground text-xs">
										{new Date(row.createdAt).toLocaleString()}
									</TableCell>
									<TableCell className="font-medium">
										@{row.admin.username ?? row.admin.name}
									</TableCell>
									<TableCell>
										<Badge variant={ACTION_VARIANT[row.action] ?? "outline"}>
											{row.action}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground">
										{row.targetType ? (
											<span>
												{row.targetType.toLowerCase()}
												{row.targetId ? `:${row.targetId.slice(0, 8)}` : ""}
											</span>
										) : (
											"—"
										)}
									</TableCell>
									<TableCell>
										<pre className="max-w-md overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
											{JSON.stringify(row.metadata, null, 0)}
										</pre>
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
