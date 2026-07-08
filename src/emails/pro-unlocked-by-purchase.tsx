import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface ProUnlockedByPurchaseEmailProps {
	name: string
	dashboardUrl: string
}

export default function ProUnlockedByPurchaseEmail({
	name,
	dashboardUrl,
}: ProUnlockedByPurchaseEmailProps) {
	return (
		<EmailLayout
			preview="Your PStrack Pro is active"
			note="You're receiving this because you purchased Pro on PStrack."
			footerText="Thanks for the support."
		>
			<Text style={s.heading}>Pro unlocked.</Text>
			<Text style={s.para}>
				Hey {name} - your purchase is complete and Pro is active on your account. No
				subscription, no renewals - it&apos;s yours permanently. Create groups, join up to
				5, run groups of 50, and get 4 pauses a month.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={dashboardUrl} style={s.ctaGreen}>
					Go to Dashboard
				</Button>
			</Section>
		</EmailLayout>
	)
}
