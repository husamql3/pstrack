import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface ProUnlockedByPointsEmailProps {
	name: string
	dashboardUrl: string
}

export default function ProUnlockedByPointsEmail({
	name,
	dashboardUrl,
}: ProUnlockedByPointsEmailProps) {
	return (
		<EmailLayout
			preview="You solved your way to Pro - 3,000 points"
			note="You're receiving this because you unlocked Pro on PSTrack."
			footerText="You earned it."
		>
			<Text style={s.heading}>Pro unlocked.</Text>
			<Text style={s.para}>
				Hey {name} - 3,000 points. You earned Pro the hard way, by showing up every day.
				No payment, no subscription. It&apos;s yours permanently.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={dashboardUrl} style={s.ctaGreen}>
					Go to Dashboard
				</Button>
			</Section>
		</EmailLayout>
	)
}
