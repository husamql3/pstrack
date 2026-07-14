import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface ProUnlockedByAdminEmailProps {
	name: string
	dashboardUrl: string
	expiresAt: string | null
}

export default function ProUnlockedByAdminEmail({
	name,
	dashboardUrl,
	expiresAt,
}: ProUnlockedByAdminEmailProps) {
	return (
		<EmailLayout
			preview="You're a PStrack Pro user now"
			note="You're receiving this because PStrack upgraded your account."
			footerText="Keep showing up."
		>
			<Text style={s.heading}>You&apos;re Pro now.</Text>
			<Text style={s.para}>
				Hey {name} - we&apos;ve upgraded your account to Pro in recognition of your
				contribution and performance.
			</Text>
			{expiresAt && (
				<Text style={s.para}>
					Your Pro access is active until <strong>{expiresAt}</strong>.
				</Text>
			)}
			<Section style={s.ctaSection}>
				<Button href={dashboardUrl} style={s.ctaGreen}>
					Go to Dashboard
				</Button>
			</Section>
		</EmailLayout>
	)
}
