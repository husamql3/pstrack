import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface JoinRequestEmailProps {
	adminName: string
	requesterName: string
	groupName: string
	reviewUrl: string
}

export default function JoinRequestEmail({
	adminName,
	requesterName,
	groupName,
	reviewUrl,
}: JoinRequestEmailProps) {
	return (
		<EmailLayout
			preview={`${requesterName} wants to join ${groupName}`}
			note="You're receiving this because you're an admin of a PStrack group."
			footerText="Requests auto-expire after 24 hours."
		>
			<Text style={s.heading}>New join request.</Text>
			<Text style={s.para}>
				Hey {adminName} - <strong>{requesterName}</strong> wants to join{" "}
				<strong>{groupName}</strong>. Review their request before it expires.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={reviewUrl} style={s.ctaDark}>
					Review Request
				</Button>
			</Section>
		</EmailLayout>
	)
}
