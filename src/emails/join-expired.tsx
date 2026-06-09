import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface JoinExpiredEmailProps {
	name: string
	groupName: string
	browseUrl: string
}

export default function JoinExpiredEmail({
	name,
	groupName,
	browseUrl,
}: JoinExpiredEmailProps) {
	return (
		<EmailLayout
			preview={`Your ${groupName} request timed out - try again`}
			note="You're receiving this because you requested to join a group on PSTrack."
		>
			<Text style={s.heading}>Request timed out.</Text>
			<Text style={s.para}>
				Hey {name} - your request to join <strong>{groupName}</strong> expired after 24
				hours without a response. Try again, or find a more active group while you wait.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={browseUrl} style={s.ctaDark}>
					Browse Groups
				</Button>
			</Section>
		</EmailLayout>
	)
}
