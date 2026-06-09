import { createFileRoute } from "@tanstack/react-router"

import { AppHeader } from "@/components/app-header"
import { createSeoHead } from "@/lib/seo"

export const Route = createFileRoute("/leaderboard")({
	ssr: false,
	component: LeaderboardPage,
	head: () =>
		createSeoHead({
			title: "Global LeetCode Leaderboard",
			description:
				"PStrack's global LeetCode leaderboard. See top problem solvers ranked by points, streaks, and consistency.",
			path: "/leaderboard",
			noindex: true,
		}),
})

function LeaderboardPage() {
	return (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<div>Leaderboard</div>
			</main>
		</div>
	)
}
