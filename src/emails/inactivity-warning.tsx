import { Button, Section, Text } from "@react-email/components"

import { GroupType } from "@/generated/prisma/enums"
import { EmailLayout, s } from "./layout"

interface InactivityWarningEmailProps {
	name: string
	groupName: string
	missedCount: number
	groupType: GroupType
	dashboardUrl: string
}

export default function InactivityWarningEmail({
	name,
	groupName,
	missedCount,
	groupType,
	dashboardUrl,
}: InactivityWarningEmailProps) {
	const isPublic = groupType === GroupType.PUBLIC

	return (
		<EmailLayout
			preview={
				isPublic
					? `${missedCount} missed days in ${groupName} - solve or pause next`
					: `${missedCount} missed days in ${groupName}`
			}
			note="You're receiving this because you were a member of a PStrack group."
		>
			<Text style={s.heading}>Time to jump back in.</Text>
			<Text style={s.para}>
				Hey {name} - you&apos;ve missed {missedCount} daily problems in a row in{" "}
				<strong>{groupName}</strong>.
			</Text>
			<Text style={s.para}>
				{isPublic
					? "Solve or pause the next daily problem to stay in the group."
					: "Your group is still there when you are ready to restart the habit."}
			</Text>
			<Section style={s.ctaSection}>
				<Button href={dashboardUrl} style={s.ctaGreen}>
					Open Dashboard
				</Button>
			</Section>
		</EmailLayout>
	)
}
