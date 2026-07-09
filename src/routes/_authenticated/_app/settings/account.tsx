import { createFileRoute } from "@tanstack/react-router"

import { DeleteAccountSection } from "@/features/settings/components/account/delete-account-section"
import { EmailSection } from "@/features/settings/components/account/email-section"
import { ProPlanSection } from "@/features/settings/components/account/pro-plan-section"
import { ProvidersSection } from "@/features/settings/components/account/providers-section"
import { SessionsSection } from "@/features/settings/components/account/sessions-section"
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton"
import { useMe } from "@/features/settings/hooks/use-me"

export const Route = createFileRoute("/_authenticated/_app/settings/account")({
	component: AccountPage,
})

function AccountPage() {
	const { data: me, isLoading } = useMe()

	if (isLoading || !me) return <SettingsSkeleton rows={3} />

	return (
		<div className="flex flex-col gap-6">
			<ProPlanSection me={me} />
			<EmailSection me={me} />
			<ProvidersSection />
			<SessionsSection />
			<DeleteAccountSection />
		</div>
	)
}
