import { zodResolver } from "@hookform/resolvers/zod"
import { IconDotsVertical, IconPlus } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useCallback, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
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
import {
	useAdminCreateGroup,
	useAdminGroups,
} from "@/features/admin/hooks/use-admin-groups"
import { ROADMAP_KEYS, ROADMAP_LABELS } from "@/features/problems/constants"
import { api } from "@/lib/api"
import { adminCreateGroupSchema } from "@/server/admin/admin.type"

const searchSchema = z.object({
	q: z.string().optional(),
	type: z.enum(["PUBLIC", "PRIVATE"]).optional(),
	frozen: z.boolean().optional(),
})

export const Route = createFileRoute("/_admin/admin/groups/")({
	validateSearch: searchSchema,
	component: AdminGroupsPage,
})

function CreateGroupDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
	const createGroup = useAdminCreateGroup()
	const queryClient = useQueryClient()

	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm({
		resolver: zodResolver(adminCreateGroupSchema),
		defaultValues: { type: "PUBLIC" as const, roadmap: "NC250", maxMembers: 30 },
	})

	const onSubmit = async (data: {
		type: "PUBLIC" | "PRIVATE"
		roadmap: string
		maxMembers: number
	}) => {
		await sileo.promise(createGroup.mutateAsync(data), {
			loading: { title: "Creating group..." },
			success: (r) => ({ title: "Group created", description: `@${r?.slug}` }),
			error: () => ({ title: "Failed to create group" }),
		})
		await queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
		reset()
		onClose()
	}

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Create group</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-1.5">
						<Label>Type</Label>
						<Controller
							control={control}
							name="type"
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isSubmitting}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PUBLIC">Public</SelectItem>
										<SelectItem value="PRIVATE">Private</SelectItem>
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Roadmap</Label>
						<Controller
							control={control}
							name="roadmap"
							render={({ field }) => (
								<Select
									value={field.value}
									onValueChange={field.onChange}
									disabled={isSubmitting}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{ROADMAP_KEYS.map((roadmap) => (
											<SelectItem key={roadmap} value={roadmap}>
												{ROADMAP_LABELS[roadmap]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<div className="space-y-1.5">
						<Label>Max members</Label>
						<Controller
							control={control}
							name="maxMembers"
							render={({ field }) => (
								<Select
									value={String(field.value)}
									onValueChange={(v) => field.onChange(Number(v))}
									disabled={isSubmitting}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[10, 20, 30, 40, 50].map((n) => (
											<SelectItem key={n} value={String(n)}>
												{n}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

function AdminGroupsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const queryClient = useQueryClient()
	const [createOpen, setCreateOpen] = useState(false)

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
					<div className="flex items-center gap-2">
						<AdminSearchInput
							initial={search.q ?? ""}
							placeholder="Search by slug..."
							onChange={handleQueryChange}
						/>
						<Button size="sm" onClick={() => setCreateOpen(true)}>
							<IconPlus className="size-4" />
							New group
						</Button>
					</div>
				}
			/>

			<CreateGroupDialog open={createOpen} onClose={() => setCreateOpen(false)} />

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
								<TableHead className="hidden sm:table-cell">Type</TableHead>
								<TableHead className="hidden sm:table-cell">Roadmap</TableHead>
								<TableHead className="hidden text-right sm:table-cell">Members</TableHead>
								<TableHead className="hidden text-right sm:table-cell">
									Daily problems
								</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((g) => (
								<TableRow key={g.id}>
									<TableCell className="font-medium">
										<Link
											className="hover:underline"
											params={{ groupId: g.id }}
											to="/admin/groups/$groupId"
										>
											@{g.slug}
										</Link>
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<Badge variant={g.type === "PUBLIC" ? "outline" : "secondary"}>
											{g.type.toLowerCase()}
										</Badge>
									</TableCell>
									<TableCell className="hidden sm:table-cell">{g.roadmap}</TableCell>
									<TableCell className="hidden text-right tabular-nums sm:table-cell">
										{g._count.members} / {g.maxMembers}
									</TableCell>
									<TableCell className="hidden text-right tabular-nums sm:table-cell">
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
