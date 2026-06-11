import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import { sileo } from "sileo"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Difficulty, ProblemSource } from "@/generated/prisma/enums"
import { api } from "@/lib/api"

const searchSchema = z.object({
	q: z.string().optional(),
	difficulty: z.enum(Difficulty).optional(),
	source: z.enum(ProblemSource).optional(),
})

export const Route = createFileRoute("/_admin/admin/problems")({
	validateSearch: searchSchema,
	component: AdminProblemsPage,
})

const DIFFICULTY_COLOR: Record<string, string> = {
	EASY: "text-emerald-500",
	MEDIUM: "text-amber-500",
	HARD: "text-red-500",
}

function AdminProblemsPage() {
	const search = Route.useSearch()
	const navigate = useNavigate({ from: Route.fullPath })
	const queryClient = useQueryClient()

	const { data, isLoading } = useQuery({
		queryKey: ["admin", "problems", search],
		queryFn: async () => {
			const { data, error } = await api.v3.admin.problems.get({
				query: {
					...(search.q ? { q: search.q } : {}),
					...(search.difficulty ? { difficulty: search.difficulty } : {}),
					...(search.source ? { source: search.source } : {}),
				},
			})
			if (error) throw new Error("Failed to load problems")
			return data
		},
	})

	const handleQueryChange = useCallback(
		(q: string) => navigate({ search: (prev) => ({ ...prev, q: q || undefined }) }),
		[navigate]
	)

	const handleReseed = async () => {
		const result = await sileo.promise(api.v3.admin.problems.seed.post(), {
			loading: { title: "Re-seeding..." },
			success: (r) => ({
				title: "Seed complete",
				description: `Seeded ${r.data?.seeded ?? 0}, skipped ${r.data?.skipped ?? 0}.`,
			}),
			error: () => ({ title: "Failed" }),
		})
		if (result.data) {
			await queryClient.invalidateQueries({ queryKey: ["admin", "problems"] })
		}
	}

	const items = data?.items ?? []

	return (
		<>
			<AdminPageHeader
				title="Problems"
				description="NeetCode 250 catalog and custom problems"
				actions={
					<>
						<AdminSearchInput
							initial={search.q ?? ""}
							placeholder="Search problems..."
							onChange={handleQueryChange}
						/>
						<Button size="sm" onClick={handleReseed}>
							Re-seed
						</Button>
					</>
				}
			/>

			<div className="flex flex-wrap gap-2">
				<Select
					value={search.difficulty ?? "all"}
					onValueChange={(v) =>
						navigate({
							search: (prev) => ({
								...prev,
								difficulty: v === "all" ? undefined : (v as keyof typeof Difficulty),
							}),
						})
					}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Difficulty" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All difficulties</SelectItem>
						<SelectItem value={Difficulty.EASY}>Easy</SelectItem>
						<SelectItem value={Difficulty.MEDIUM}>Medium</SelectItem>
						<SelectItem value={Difficulty.HARD}>Hard</SelectItem>
					</SelectContent>
				</Select>
				<Select
					value={search.source ?? "all"}
					onValueChange={(v) =>
						navigate({
							search: (prev) => ({
								...prev,
								source: v === "all" ? undefined : (v as keyof typeof ProblemSource),
							}),
						})
					}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Source" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All sources</SelectItem>
						<SelectItem value={ProblemSource.NEETCODE}>NeetCode</SelectItem>
						<SelectItem value={ProblemSource.CUSTOM}>Custom</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{isLoading ? (
				<Skeleton className="h-96 w-full" />
			) : items.length === 0 ? (
				<AdminEmpty title="No problems found" />
			) : (
				<div className="rounded-lg border bg-card">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-12">#</TableHead>
								<TableHead>Title</TableHead>
								<TableHead className="hidden sm:table-cell">Topic</TableHead>
								<TableHead>Difficulty</TableHead>
								<TableHead className="hidden sm:table-cell">Roadmaps</TableHead>
								<TableHead className="hidden sm:table-cell">Source</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((p) => (
								<TableRow key={p.id}>
									<TableCell className="text-muted-foreground tabular-nums">
										{p.roadmapIndex}
									</TableCell>
									<TableCell className="font-medium">{p.title}</TableCell>
									<TableCell className="hidden text-muted-foreground sm:table-cell">
										{p.topic}
									</TableCell>
									<TableCell className={`font-medium ${DIFFICULTY_COLOR[p.difficulty]}`}>
										{p.difficulty}
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<div className="flex gap-1">
											{p.neetcode250 ? <Badge variant="outline">NC250</Badge> : null}
											{p.neetcode150 ? <Badge variant="outline">NC150</Badge> : null}
											{p.blind75 ? <Badge variant="outline">Blind75</Badge> : null}
										</div>
									</TableCell>
									<TableCell className="hidden sm:table-cell">
										<Badge variant={p.source === "CUSTOM" ? "secondary" : "outline"}>
											{p.source.toLowerCase()}
										</Badge>
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
