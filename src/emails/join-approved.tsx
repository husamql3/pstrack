import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface JoinApprovedEmailProps {
	name: string
	groupName: string
	groupUrl: string
}

export default function JoinApprovedEmail({
	name,
	groupName,
	groupUrl,
}: JoinApprovedEmailProps) {
	return (
		<EmailLayout
			preview={`You're in - ${groupName} approved your request`}
			note="You're receiving this because you requested to join a group on PSTrack."
		>
			<Text style={s.heading}>You&apos;re in.</Text>
			<Text style={s.para}>
				Hey {name} - <strong>{groupName}</strong> approved your request. Grab today&apos;s
				problem and get on the board.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={groupUrl} style={s.ctaGreen}>
					Go to Group
				</Button>
			</Section>
		</EmailLayout>
	)
}
