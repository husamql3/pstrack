import { createFileRoute } from "@tanstack/react-router"

import { DashboardPage } from "@/features/dashboard/components/dashboard-page"

export const Route = createFileRoute("/_authenticated/_app/dashboard")({
	component: DashboardPage,
})
