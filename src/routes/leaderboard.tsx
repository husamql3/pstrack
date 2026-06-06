import { createFileRoute } from "@tanstack/react-router"

import { AppHeader } from "@/components/app-header"

export const Route = createFileRoute("/leaderboard")({
	component: LeaderboardPage,
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
