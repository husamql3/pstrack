import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface RemovedFromGroupEmailProps {
	name: string
	groupName: string
	browseUrl: string
}

export default function RemovedFromGroupEmail({
	name,
	groupName,
	browseUrl,
}: RemovedFromGroupEmailProps) {
	return (
		<EmailLayout
			preview={`Removed from ${groupName} - your progress is safe`}
			note="You're receiving this because you were a member of a PStrack group."
		>
			<Text style={s.heading}>You&apos;ve been removed.</Text>
			<Text style={s.para}>
				Hey {name} - you&apos;ve been removed from <strong>{groupName}</strong>. Your
				points and streak are untouched - they belong to you, not the group. Find your
				next group and keep going.
			</Text>
			<Section style={s.ctaSection}>
				<Button href={browseUrl} style={s.ctaDark}>
					Browse Groups
				</Button>
			</Section>
		</EmailLayout>
	)
}
