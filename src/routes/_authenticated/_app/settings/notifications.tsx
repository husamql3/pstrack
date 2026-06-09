import { createFileRoute } from "@tanstack/react-router"

import { DailyReminderSection } from "@/features/settings/components/notifications/daily-reminder-section"
import { EmailPrefsSection } from "@/features/settings/components/notifications/email-prefs-section"
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton"
import { useMe } from "@/features/settings/hooks/use-me"

export const Route = createFileRoute("/_authenticated/_app/settings/notifications")({
	component: NotificationsPage,
})

function NotificationsPage() {
	const { data: me, isLoading } = useMe()

	if (isLoading || !me) return <SettingsSkeleton rows={2} />

	return (
		<div className="flex flex-col gap-6">
			<DailyReminderSection />
			<EmailPrefsSection me={me} />
		</div>
	)
}
