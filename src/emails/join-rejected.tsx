import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface JoinRejectedEmailProps {
	name: string
	groupName: string
	browseUrl: string
}

export default function JoinRejectedEmail({
	name,
	groupName,
	browseUrl,
}: JoinRejectedEmailProps) {
	return (
		<EmailLayout
			preview={`Your request to join ${groupName} - next steps`}
			note="You're receiving this because you requested to join a group on PStrack."
		>
			<Text style={s.heading}>Not this time.</Text>
			<Text style={s.para}>
				Hey {name} - your request to join <strong>{groupName}</strong> wasn&apos;t
				approved. That&apos;s okay. There are plenty of other groups - find one that fits,
				or start your own.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={browseUrl} style={s.ctaDark}>
					Browse Groups
				</Button>
			</Section>
		</EmailLayout>
	)
}
