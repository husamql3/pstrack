import { createFileRoute, Outlet } from "@tanstack/react-router"

import { SettingsSidebar } from "@/features/settings/components/settings-sidebar"

export const Route = createFileRoute("/_authenticated/_app/settings")({
	component: SettingsLayout,
})

function SettingsLayout() {
	return (
		<div className="mx-auto w-full max-w-5xl">
			<header className="mb-8">
				<h1 className="font-semibold text-2xl tracking-tight">Settings</h1>
				<p className="mt-1 text-muted-foreground text-sm">
					Manage your account, profile, notifications, and Pro plan.
				</p>
			</header>
			<div className="flex gap-10">
				<SettingsSidebar />
				<div className="min-w-0 flex-1">
					<Outlet />
				</div>
			</div>
		</div>
	)
}
