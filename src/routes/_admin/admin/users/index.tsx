import { IconDotsVertical } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
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
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const searchSchema = z.object({
	q: z.string().optional(),
	role: z.enum(["admin", "user"]).optional(),
	isPro: z.boolean().optional(),
	banned: z.boolean().optional(),
})

export const Route = createFileRoute("/_admin/admin/users/")({
	validateSearch: searchSchema,
	component: AdminUsersListPage,
})

function AdminUsersListPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const queryClient = useQueryClient()

	const { data, isLoading } = useAdminUsers({
		q: search.q,
		role: search.role,
		isPro: search.isPro,
		banned: search.banned,
	})

	const handleQueryChange = useCallback(
		(q: string) => {
			navigate({ search: (prev) => ({ ...prev, q: q || undefined }) })
		},
		[navigate]
	)

	const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] })

	const handleBanToggle = async (id: string, banned: boolean) => {
		await sileo.promise(
			api.v4.admin.users({ id }).ban.patch({
				banned: !banned,
				reason: banned ? undefined : "Banned via admin UI",
			}),
			{
				loading: { title: banned ? "Unbanning..." : "Banning..." },
				success: { title: banned ? "User unbanned" : "User banned" },
				error: () => ({ title: "Failed to update ban" }),
			}
		)
		await refresh()
	}

	const handleImpersonate = async (id: string) => {
		await api.v4.admin.users({ id })["impersonate-audit"].post()
		const { error } = await authClient.admin.impersonateUser({ userId: id })
		if (error) {
			sileo.error({ title: "Impersonation failed", description: error.message })
			return
		}
		await queryClient.invalidateQueries()
		navigate({ to: "/dashboard" })
	}

	const items = data?.items ?? []

	return (
		<>
			<AdminPageHeader
				title="Users"
				description={`${data?.items.length ?? 0} users in current page`}
				actions={
					<AdminSearchInput
						initial={search.q ?? ""}
						placeholder="Search by name, email, username..."
						onChange={handleQueryChange}
					/>
				}
			/>

			{isLoading ? (
				<UserTableSkeleton />
			) : items.length === 0 ? (
				<AdminEmpty title="No users match these filters" />
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Points</TableHead>
								<TableHead className="text-right">Streak</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((u) => (
								<TableRow key={u.id}>
									<TableCell>
										<Link
											to="/admin/users/$id"
											params={{ id: u.id }}
											className="flex flex-col"
										>
											<span className="font-medium">{u.username ?? u.name}</span>
											<span className="text-muted-foreground text-xs">{u.name}</span>
										</Link>
									</TableCell>
									<TableCell className="text-muted-foreground">{u.email}</TableCell>
									<TableCell>
										{u.role === "admin" ? (
											<Badge variant="secondary">admin</Badge>
										) : (
											<span className="text-muted-foreground">user</span>
										)}
									</TableCell>
									<TableCell>
										<div className="flex flex-wrap gap-1">
											{u.banned ? <Badge variant="destructive">banned</Badge> : null}
											{u.isPro ? <Badge>pro</Badge> : null}
										</div>
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{u.totalPoints.toLocaleString()}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{u.currentStreak}
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button size="icon-sm" variant="ghost">
													<IconDotsVertical className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem asChild>
													<Link to="/admin/users/$id" params={{ id: u.id }}>
														View detail
													</Link>
												</DropdownMenuItem>
												<DropdownMenuItem onSelect={() => handleImpersonate(u.id)}>
													Impersonate
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													variant="destructive"
													onSelect={() => handleBanToggle(u.id, u.banned ?? false)}
												>
													{u.banned ? "Unban" : "Ban"}
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

const UserTableSkeleton = () => (
	<div className="space-y-2">
		{Array.from({ length: 8 }).map((_, i) => (
			// biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
			<Skeleton key={i} className="h-12 w-full" />
		))}
	</div>
)
