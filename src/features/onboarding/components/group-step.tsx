import { IconUsers } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"

export const GroupStep = ({ onBack }: { onBack: () => void }) => {
	const navigate = useNavigate()

	const finish = () => {
		sileo.success({ title: "Welcome to PSTrack!" })
		navigate({ to: "/dashboard" })
	}

	return (
		<main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
			<div className="flex w-full max-w-sm flex-col gap-8">
				<div className="text-center">
					<h2 className="font-bold text-2xl tracking-tight">Join a group</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Groups keep you accountable. You can always join one later.
					</p>
				</div>

				<div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-10 text-center">
					<IconUsers className="size-8 text-muted-foreground" />
					<p className="text-muted-foreground text-sm">No groups available yet.</p>
					<p className="text-muted-foreground text-xs">
						You can create or join a group from the Groups page after onboarding.
					</p>
				</div>

				<div className="flex gap-3">
					<Button variant="outline" onClick={onBack} className="flex-1">
						Back
					</Button>
					<Button onClick={finish} className="flex-1">
						Skip for now
					</Button>
				</div>
			</div>
		</main>
	)
}
