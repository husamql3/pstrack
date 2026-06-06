import { IconDotsVertical } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { sileo } from "sileo"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { AdminSearchInput } from "@/features/admin/components/admin-search-input"
import { useAdminGroups } from "@/features/admin/hooks/use-admin-groups"
import { api } from "@/lib/api"

const searchSchema = z.object({
	q: z.string().optional(),
	type: z.enum(["PUBLIC", "PRIVATE"]).optional(),
	frozen: z.boolean().optional(),
})

export const Route = createFileRoute("/_admin/admin/groups")({
	validateSearch: searchSchema,
	component: AdminGroupsPage,
})

function AdminGroupsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const queryClient = useQueryClient()

	const { data, isLoading } = useAdminGroups({
		q: search.q,
		type: search.type,
		frozen: search.frozen,
	})

	const handleQueryChange = useCallback(
		(q: string) => navigate({ search: (prev) => ({ ...prev, q: q || undefined }) }),
		[navigate]
	)

	const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })

	const handleFreezeToggle = async (id: string, frozen: boolean) => {
		await sileo.promise(api.v3.admin.groups({ id }).freeze.patch({ frozen: !frozen }), {
			loading: { title: frozen ? "Unfreezing..." : "Freezing..." },
			success: { title: frozen ? "Group unfrozen" : "Group frozen" },
			error: () => ({ title: "Failed" }),
		})
		await refresh()
	}

	const handleDelete = async (id: string, slug: string) => {
		if (
			!confirm(
				`Delete group @${slug}? This will remove all members, daily problems, and join requests.`
			)
		) {
			return
		}
		await sileo.promise(api.v3.admin.groups({ id }).delete(), {
			loading: { title: "Deleting..." },
			success: { title: "Group deleted" },
			error: () => ({ title: "Failed" }),
		})
		await refresh()
	}

	const items = data?.items ?? []

	return (
		<>
			<AdminPageHeader
				title="Groups"
				description="Manage groups across the platform"
				actions={
					<AdminSearchInput
						initial={search.q ?? ""}
						placeholder="Search by slug..."
						onChange={handleQueryChange}
					/>
				}
			/>

			{isLoading ? (
				<Skeleton className="h-64 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No groups found" />
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Slug</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Roadmap</TableHead>
								<TableHead className="text-right">Members</TableHead>
								<TableHead className="text-right">Daily problems</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((g) => (
								<TableRow key={g.id}>
									<TableCell className="font-medium">@{g.slug}</TableCell>
									<TableCell>
										<Badge variant={g.type === "PUBLIC" ? "outline" : "secondary"}>
											{g.type.toLowerCase()}
										</Badge>
									</TableCell>
									<TableCell>{g.roadmap}</TableCell>
									<TableCell className="text-right tabular-nums">
										{g._count.members} / {g.maxMembers}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{g._count.dailyProblems}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{g.frozen ? <Badge variant="destructive">frozen</Badge> : null}
											{!g.isActive ? <Badge variant="outline">inactive</Badge> : null}
										</div>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="icon-sm" variant="ghost">
													<IconDotsVertical className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													onSelect={() => handleFreezeToggle(g.id, g.frozen)}
												>
													{g.frozen ? "Unfreeze" : "Freeze"}
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onSelect={() => handleDelete(g.id, g.slug)}
												>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
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
