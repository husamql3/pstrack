import { createFileRoute } from "@tanstack/react-router"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AdminPageHeader } from "@/features/admin/components/admin-page-header"
import { useAdminStats } from "@/features/admin/hooks/use-admin-stats"

export const Route = createFileRoute("/_admin/admin/")({
	component: AdminOverview,
})

const STAT_CARDS = [
	{ key: "users", label: "Total users" },
	{ key: "activeUsers7d", label: "Active 7d" },
	{ key: "groups", label: "Active groups" },
	{ key: "solvesToday", label: "Solves today" },
	{ key: "proUsers", label: "Pro users" },
	{ key: "signupsToday", label: "Signups today" },
] as const

function AdminOverview() {
	const { data, isLoading } = useAdminStats()

	return (
		<>
			<AdminPageHeader
				title="Overview"
				description="Platform vitals refreshed every minute."
			/>

			<div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
				{STAT_CARDS.map((card) => (
					<Card key={card.key}>
						<CardHeader className="pb-2">
							<CardTitle className="font-normal text-muted-foreground text-xs">
								{card.label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoading || !data ? (
								<Skeleton className="h-7 w-16" />
							) : (
								<div className="font-semibold text-2xl tabular-nums">
									{data.totals[card.key].toLocaleString()}
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Signups (last 30 days)</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading || !data ? (
						<Skeleton className="h-32 w-full" />
					) : (
						<SignupsBarChart data={data.signups30d} />
					)}
				</CardContent>
			</Card>
		</>
	)
}

function SignupsBarChart({ data }: { data: Array<{ date: string; count: number }> }) {
	const max = Math.max(1, ...data.map((d) => d.count))
	return (
		<div className="flex h-32 items-end gap-1">
			{data.map((d) => (
				<div
					key={d.date}
					title={`${d.date}: ${d.count}`}
					className="flex-1 rounded-t bg-primary/60 hover:bg-primary"
					style={{ height: `${(d.count / max) * 100}%`, minHeight: "2px" }}
				/>
			))}
		</div>
	)
}
