import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "../section-card"

export const DailyReminderSection = () => (
	<SectionCard
		title="Daily reminder"
		description="A nudge email at the time you pick - keeping you on streak."
		badge="Coming soon"
	>
		<div className="grid max-w-xs gap-1.5">
			<Label htmlFor="daily-reminder-time">Send my daily reminder at</Label>
			<Input id="daily-reminder-time" type="time" defaultValue="08:00" disabled />
			<p className="text-muted-foreground text-xs">
				We'll wire this up in a future update.
			</p>
		</div>
	</SectionCard>
)
