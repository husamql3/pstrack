import { createFileRoute } from "@tanstack/react-router"

import { PlanSection } from "@/features/settings/components/plan/plan-section"
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton"
import { useMe } from "@/features/settings/hooks/use-me"

export const Route = createFileRoute("/_authenticated/_app/settings/plan")({
	component: PlanPage,
})

function PlanPage() {
	const { data: me, isLoading } = useMe()

	if (isLoading || !me) return <SettingsSkeleton rows={1} />

	return (
		<div className="flex flex-col gap-6">
			<PlanSection me={me} />
		</div>
	)
}
