import { Link, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

function getStreakCopy(streak: number): string {
	if (streak >= 365)
		return "You showed up every single day for a full year. That's extraordinary."
	if (streak >= 100) return "That's not a habit anymore - it's who you are."
	if (streak >= 30) return "Most people quit before now. You haven't."
	return "The habit is forming - show up tomorrow and lock it in."
}

interface StreakMilestoneEmailProps {
	name: string
	streak: number
	dashboardUrl: string
}

export default function StreakMilestoneEmail({
	name,
	streak,
	dashboardUrl,
}: StreakMilestoneEmailProps) {
	return (
		<EmailLayout
			preview={`${streak}-day streak - don't stop now`}
			note="You're receiving this because you hit a streak milestone on PSTrack."
		>
			<Text style={s.heading}>{streak}-day streak.</Text>
			<Text style={s.para}>
				Hey {name} - {getStreakCopy(streak)}
			</Text>
			<Text style={s.para}>
				<Link href={dashboardUrl} style={s.link}>
					View dashboard →
				</Link>
			</Text>
		</EmailLayout>
	)
}
