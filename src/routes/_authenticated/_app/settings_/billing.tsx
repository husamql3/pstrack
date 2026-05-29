import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/_app/settings_/billing")({
	component: BillingPage,
})

function BillingPage() {
	return (
		<div className="space-y-1">
			<h1 className="font-semibold text-2xl tracking-tight">Billing</h1>
			<p className="text-muted-foreground text-sm">
				Pro upgrade will be available here soon.
			</p>
		</div>
	)
}
