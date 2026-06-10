import { createFileRoute } from "@tanstack/react-router"

import { RouteErrorFallback } from "@/components/route-error-fallback"
import { DashboardPage } from "@/features/dashboard/components/dashboard-page"

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
	component: DashboardPage,
	errorComponent: ({ error, reset }) => (
		<RouteErrorFallback
			error={error}
			reset={reset}
			title="Could not load your dashboard"
		/>
	),
})
