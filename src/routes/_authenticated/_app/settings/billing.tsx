import { createFileRoute } from "@tanstack/react-router"

import { BillingStatus } from "@/features/settings/components/billing/billing-status"
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton"
import { useMe } from "@/features/settings/hooks/use-me"

export const Route = createFileRoute("/_authenticated/_app/settings/billing")({
	component: BillingPage,
})

function BillingPage() {
	const { data: me, isLoading } = useMe()

	if (isLoading || !me) return <SettingsSkeleton rows={1} />

	return (
		<div className="flex flex-col gap-6">
			<BillingStatus me={me} />
		</div>
	)
}
