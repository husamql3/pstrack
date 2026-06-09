import { createFileRoute } from "@tanstack/react-router"

import { AppHeader } from "@/components/app-header"
import { BadgesPage } from "@/features/badges/components/badges-page"
import { useSession } from "@/lib/auth-client"

export const Route = createFileRoute("/badges")({
	component: BadgesPageRoute,
})

function BadgesPageRoute() {
	const { data: session } = useSession()
	return (
		<div className="flex h-screen flex-col">
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<BadgesPage userId={session?.user?.id ?? null} />
			</main>
		</div>
	)
}
