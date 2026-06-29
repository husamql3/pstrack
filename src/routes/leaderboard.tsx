import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"

import { AppHeader } from "@/components/app-header"
import { RouteErrorFallback } from "@/components/route-error-fallback"
import { LeaderboardPage } from "@/features/leaderboard/components/leaderboard-page"
import { createSeoHead } from "@/lib/seo"

const searchSchema = z.object({
	mode: z.enum(["group", "global"]).optional(),
	period: z.enum(["week", "month", "alltime"]).optional(),
	groupId: z.string().optional(),
})

export const Route = createFileRoute("/leaderboard")({
	ssr: false,
	validateSearch: searchSchema,
	component: LeaderboardRouteComponent,
	errorComponent: ({ error, reset }) => (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<RouteErrorFallback
					error={error}
					reset={reset}
					title="Could not load the leaderboard"
				/>
			</main>
		</div>
	),
	head: () =>
		createSeoHead({
			title: "Global LeetCode Leaderboard",
			description:
				"PStrack's global LeetCode leaderboard. See top problem solvers ranked by points, streaks, and consistency.",
			path: "/leaderboard",
			noindex: true,
		}),
})

function LeaderboardRouteComponent() {
	return (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<LeaderboardPage />
			</main>
		</div>
	)
}
