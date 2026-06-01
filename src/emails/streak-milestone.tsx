import { Body, Container, Head, Html, Preview, Text } from "@react-email/components"

interface StreakMilestoneEmailProps {
	name: string
	streak: number
	dashboardUrl: string
}

export default function StreakMilestoneEmail({
	name,
	streak,
	dashboardUrl,
}: StreakMilestoneEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>{`${streak}-day streak — keep it going on PSTrack`}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {name},</Text>
					<Text style={paragraph}>
						You just hit a <strong>{streak}-day streak</strong>. Show up tomorrow and keep
						the momentum going.
					</Text>
					<Text style={link}>
						<a href={dashboardUrl} style={anchor}>
							Go to dashboard →
						</a>
					</Text>
				</Container>
			</Body>
		</Html>
	)
}

const body = { backgroundColor: "#f6f6f6", fontFamily: "sans-serif" }
const container = {
	margin: "0 auto",
	padding: "40px 20px",
	maxWidth: "560px",
	backgroundColor: "#ffffff",
	borderRadius: "8px",
}
const heading = { fontSize: "24px", fontWeight: "700", color: "#0a0a0a" }
const paragraph = { fontSize: "16px", color: "#404040", lineHeight: "24px" }
const link = { fontSize: "16px", color: "#404040", lineHeight: "24px" }
const anchor = { color: "#0a0a0a", fontWeight: "600" }
