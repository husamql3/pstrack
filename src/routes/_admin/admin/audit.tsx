import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

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
import { AdminEmpty } from "@/features/admin/components/admin-empty"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { AdminAuditAction, SystemEventType } from "@/generated/prisma/enums"
import { api } from "@/lib/api"

const searchSchema = z.object({
	actor: z.string().optional(),
	action: z.enum(AdminAuditAction).optional(),
	eventType: z.enum(SystemEventType).optional(),
	targetId: z.string().optional(),
	origin: z.enum(["admin", "system"]).optional(),
	before: z.string().optional(),
})

export const Route = createFileRoute("/_admin/admin/audit")({
	validateSearch: searchSchema,
	component: AdminAuditPage,
})

const ADMIN_ACTION_VARIANT: Partial<
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

const SYSTEM_EVENT_VARIANT: Partial<
	Record<
		keyof typeof SystemEventType,
		"default" | "destructive" | "secondary" | "outline"
	>
> = {
	SOLVE_VERIFIED: "default",
	SOLVE_FAILED: "destructive",
	MISS_BATCH: "destructive",
	PAUSE_USED: "secondary",
	USERNAME_CHANGED: "outline",
	HANDLE_CHANGED: "outline",
	GROUP_CREATED: "default",
	GROUP_JOINED: "default",
	GROUP_LEFT: "secondary",
	MEMBER_REMOVED: "destructive",
	JOIN_REQUEST_SENT: "outline",
	JOIN_REQUEST_APPROVED: "default",
	JOIN_REQUEST_REJECTED: "secondary",
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
					...(search.eventType ? { eventType: search.eventType } : {}),
					...(search.targetId ? { targetId: search.targetId } : {}),
					...(search.origin ? { origin: search.origin } : {}),
					...(search.before ? { before: search.before } : {}),
				},
			})
			if (error) throw new Error("Failed to load audit log")
			return data
		},
	})

	const items = data?.items ?? []
	const nextCursor = data?.nextCursor ?? null

	return (
		<>
			<AdminPageHeader
				title="Audit log"
				description="Every admin mutation and user action, unified."
			/>

			<div className="mb-4 flex gap-2">
				{(["all", "admin", "system"] as const).map((o) => {
					const active = (search.origin ?? "all") === o
					return (
						<a
							key={o}
							href={`?${new URLSearchParams({ ...(o !== "all" ? { origin: o } : {}) }).toString()}`}
						>
							<Badge
								variant={active ? "default" : "outline"}
								className="cursor-pointer capitalize"
							>
								{o}
							</Badge>
						</a>
					)
				})}
			</div>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No audit entries yet" />
			) : (
				<>
					<div className="rounded-lg border bg-card">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="whitespace-nowrap">When</TableHead>
									<TableHead>Origin</TableHead>
									<TableHead>Actor</TableHead>
									<TableHead>Event</TableHead>
									<TableHead className="hidden sm:table-cell">Target</TableHead>
									<TableHead className="hidden sm:table-cell">Metadata</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((row) => {
									const isAdmin = row.origin === "admin"
									const actorLabel = isAdmin
										? `@${row.admin.username ?? row.admin.name}`
										: row.actorUsername
											? `@${row.actorUsername}`
											: "system"
									const eventLabel = isAdmin ? row.action : row.eventType
									const eventVariant = isAdmin
										? (ADMIN_ACTION_VARIANT[
												row.action as keyof typeof AdminAuditAction
											] ?? "outline")
										: (SYSTEM_EVENT_VARIANT[
												row.eventType as keyof typeof SystemEventType
											] ?? "outline")

									return (
										<TableRow key={row.id}>
											<TableCell className="whitespace-nowrap text-muted-foreground text-xs">
												{new Date(row.createdAt).toLocaleString()}
											</TableCell>
											<TableCell>
												<Badge
													variant={isAdmin ? "secondary" : "outline"}
													className="text-xs"
												>
													{row.origin}
												</Badge>
											</TableCell>
											<TableCell className="font-medium">{actorLabel}</TableCell>
											<TableCell>
												<Badge variant={eventVariant}>{eventLabel}</Badge>
											</TableCell>
											<TableCell className="hidden text-muted-foreground sm:table-cell">
												{row.targetType ? (
													<span>
														{row.targetType.toLowerCase()}
														{row.targetId ? `:${row.targetId.slice(0, 8)}` : ""}
													</span>
												) : (
													"-"
												)}
											</TableCell>
											<TableCell className="hidden sm:table-cell">
												<pre className="max-w-md overflow-x-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
													{JSON.stringify(row.metadata, null, 0)}
												</pre>
											</TableCell>
										</TableRow>
									)
								})}
							</TableBody>
						</Table>
					</div>

					{nextCursor && (
						<div className="mt-4 flex justify-center">
							<a
								href={`?${new URLSearchParams({ ...search, before: nextCursor }).toString()}`}
							>
								<Button variant="outline" size="sm">
									Load more
								</Button>
							</a>
						</div>
					)}
				</>
			)}
		</>
	)
}
