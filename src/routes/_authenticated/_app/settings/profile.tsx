import { createFileRoute } from "@tanstack/react-router"

import { BasicsSection } from "@/features/settings/components/profile/basics-section"
import { HandlesSection } from "@/features/settings/components/profile/handles-section"
import { SocialsSection } from "@/features/settings/components/profile/socials-section"
import { UsernameSection } from "@/features/settings/components/profile/username-section"
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton"
import { useMe } from "@/features/settings/hooks/use-me"

export const Route = createFileRoute("/_authenticated/_app/settings/profile")({
	component: ProfilePage,
})

function ProfilePage() {
	const { data: me, isLoading } = useMe()

	if (isLoading || !me) return <SettingsSkeleton rows={4} />

	return (
		<div className="flex flex-col gap-6">
			<UsernameSection me={me} />
			<BasicsSection me={me} />
			<HandlesSection me={me} />
			<SocialsSection me={me} />
		</div>
	)
}
