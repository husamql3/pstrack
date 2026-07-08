import { IconCircleCheckFilled } from "@tabler/icons-react"
import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { ME_QUERY_KEY } from "@/features/settings/hooks/use-me"
import { authClient } from "@/lib/auth-client"

type SuccessSearch = { checkout_id?: string }

export const Route = createFileRoute("/success")({
	validateSearch: (search: Record<string, unknown>): SuccessSearch => ({
		checkout_id: typeof search.checkout_id === "string" ? search.checkout_id : undefined,
	}),
	component: SuccessPage,
})

function SuccessPage() {
	const queryClient = useQueryClient()

	// The webhook is the source of truth for the Pro grant; it may land a beat
	// before or after this redirect. Force a fresh session + `me` so Pro shows up
	// as soon as it's applied, without a manual reload.
	useEffect(() => {
		void authClient.getSession({ query: { disableCookieCache: true } })
		void queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
	}, [queryClient])

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-6">
			<div className="flex max-w-md flex-col items-center gap-5 text-center">
				<IconCircleCheckFilled className="size-14 text-warning" aria-hidden="true" />
				<div>
					<h1 className="font-semibold text-2xl tracking-tight">You're Pro 🎉</h1>
					<p className="mt-2 text-muted-foreground text-sm">
						Your purchase is complete and Pro is now active on your account — lifetime, no
						renewals. Create groups, join up to 5, run groups of 50, and get 4 pauses a
						month.
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard">Go to Dashboard</Link>
				</Button>
			</div>
		</div>
	)
}
