import { IconExternalLink } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { api } from "@/lib/api"

const GITHUB_REPO = "husamahmud/pstrack"

const searchSchema = z.object({
	groupId: z.string().optional(),
	reviewed: z.boolean().optional(),
})

export const Route = createFileRoute("/_admin/admin/feedbacks")({
	validateSearch: searchSchema,
	component: AdminFeedbacksPage,
})

function githubIssueUrl(
	category: string | null,
	description: string | null,
	groupSlug: string | null,
	username: string | null
) {
	const title = `Feedback [${category ?? "general"}] from @${username ?? "unknown"}${groupSlug ? ` in @${groupSlug}` : ""}`
	const body = [
		category ? `**Category:** ${category}` : "",
		groupSlug ? `**Group:** @${groupSlug}` : "",
		`**User:** @${username ?? "unknown"}`,
		description ? `\n**Description:**\n${description}` : "",
	]
		.filter(Boolean)
		.join("\n")
	return `https://github.com/${GITHUB_REPO}/issues/new?${new URLSearchParams({ title, body }).toString()}`
}

function AdminFeedbacksPage() {
	const search = Route.useSearch()
	const queryClient = useQueryClient()
	const [expandedDescription, setExpandedDescription] = useState<string | null>(null)

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "feedbacks", search],
		queryFn: async () => {
			const { data, error } = await api.v3.feedbacks.get({
				query: {
					...(search.groupId ? { groupId: search.groupId } : {}),
					...(search.reviewed !== undefined ? { reviewed: search.reviewed } : {}),
				},
			})
			if (error) throw new Error("Failed to load feedbacks")
			return data
		},
	})

	const markReviewed = useMutation({
		mutationFn: async ({ id, reviewed }: { id: string; reviewed: boolean }) => {
			const { data, error } = await api.v3.feedbacks({ id }).reviewed.patch({ reviewed })
			if (error) throw new Error("Failed to update feedback")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin", "feedbacks"] })
		},
	})

	const items = data ?? []

	return (
		<>
			<Dialog
				open={expandedDescription !== null}
				onOpenChange={(open) => !open && setExpandedDescription(null)}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Feedback Description</DialogTitle>
					</DialogHeader>
					<p className="whitespace-pre-wrap text-sm">{expandedDescription}</p>
				</DialogContent>
			</Dialog>

			<AdminPageHeader
				title="Feedbacks"
				description="Group member feedback — review and escalate to GitHub issues."
			/>

			<div className="mb-4 flex gap-2">
				{(["all", "pending", "reviewed"] as const).map((filter) => {
					const active =
						filter === "all"
							? search.reviewed === undefined
							: filter === "reviewed"
								? search.reviewed === true
								: search.reviewed === false
					const href =
						filter === "all"
							? "?"
							: `?${new URLSearchParams({ reviewed: String(filter === "reviewed") }).toString()}`
					return (
						<a key={filter} href={href}>
							<Badge
								variant={active ? "default" : "outline"}
								className="cursor-pointer capitalize"
							>
								{filter}
							</Badge>
						</a>
					)
				})}
			</div>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty
					title="No feedbacks yet"
					description="Feedbacks submitted by group members will appear here."
				/>
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="whitespace-nowrap">When</TableHead>
								<TableHead>User</TableHead>
								<TableHead>Group</TableHead>
								<TableHead>Category</TableHead>
								<TableHead>Description</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((row) => (
								<TableRow
									key={row.id}
									className={row.reviewed ? "opacity-50" : undefined}
								>
									<TableCell className="whitespace-nowrap text-muted-foreground text-xs">
										{new Date(row.createdAt).toLocaleString()}
									</TableCell>
									<TableCell className="font-medium">
										@{row.user.username ?? row.user.name}
									</TableCell>
									<TableCell>{row.group ? `@${row.group.slug}` : "—"}</TableCell>
									<TableCell>
										{row.category ? (
											<Badge variant="secondary" className="capitalize">
												{row.category.toLowerCase()}
											</Badge>
										) : (
											<Badge variant="outline">{row.source.toLowerCase()}</Badge>
										)}
									</TableCell>
									<TableCell className="max-w-xs">
										{row.description ? (
											<button
												type="button"
												className="block max-w-full cursor-pointer truncate text-left text-muted-foreground text-sm underline-offset-2 hover:underline"
												onClick={() => setExpandedDescription(row.description ?? "")}
											>
												{row.description}
											</button>
										) : (
											<span className="text-muted-foreground text-sm">—</span>
										)}
									</TableCell>
									<TableCell>
										{row.reviewed ? (
											<Badge variant="outline">reviewed</Badge>
										) : (
											<Badge variant="default">pending</Badge>
										)}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-2">
											<Button
												variant="ghost"
												size="sm"
												disabled={markReviewed.isPending}
												onClick={() =>
													markReviewed.mutate({ id: row.id, reviewed: !row.reviewed })
												}
											>
												{row.reviewed ? "Unmark" : "Mark reviewed"}
											</Button>
											<Button variant="outline" size="sm" asChild>
												<a
													href={githubIssueUrl(
														row.category ?? null,
														row.description ?? null,
														row.group?.slug ?? null,
														row.user.username ?? null
													)}
													target="_blank"
													rel="noopener noreferrer"
												>
													<IconExternalLink className="mr-1.5 size-3.5" />
													GH issue
												</a>
											</Button>
										</div>
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
