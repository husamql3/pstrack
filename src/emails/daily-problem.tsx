import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface DailyProblemEmailProps {
	name: string
	groupName: string
	problemTitle: string
	difficulty: string
	topic: string
	problemUrl: string
	dashboardUrl: string
}

export default function DailyProblemEmail({
	name,
	groupName,
	problemTitle,
	difficulty,
	topic,
	problemUrl,
	dashboardUrl,
}: DailyProblemEmailProps) {
	return (
		<EmailLayout
			preview={`Today's problem: ${problemTitle} (${difficulty})`}
			note={`You're receiving this because you're in ${groupName} on PSTrack.`}
		>
			<Text style={s.heading}>Today&apos;s problem is ready.</Text>
			<Text style={s.para}>
				Hey {name} - here&apos;s your daily problem for {groupName}:
			</Text>
			<Section style={s.highlight}>
				<Text style={s.highlightTitle}>{problemTitle}</Text>
				<Text style={s.highlightMeta}>
					{difficulty} &middot; {topic}
				</Text>
			</Section>
			<Text style={s.para}>
				Solve it, then mark it done on your dashboard before the day ends - your streak
				depends on it.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={problemUrl} style={s.ctaDark}>
					Open in LeetCode
				</Button>
				<Button href={dashboardUrl} style={s.ctaOutline}>
					View Dashboard
				</Button>
			</Section>
		</EmailLayout>
	)
}
