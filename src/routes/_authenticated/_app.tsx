import { createFileRoute, Outlet } from "@tanstack/react-router"

import { AppHeader } from "@/components/app-header"

export const Route = createFileRoute("/_authenticated/_app")({
	component: AppLayout,
})

function AppLayout() {
	return (
		<div className="min-h-screen">
			<AppHeader />
			<main className="mx-auto max-w-6xl px-4 py-8">
				<Outlet />
			</main>
		</div>
	)
}
