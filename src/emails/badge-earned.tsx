import { Body, Container, Head, Html, Preview, Text } from "@react-email/components"

const BADGE_LABELS: Record<string, string> = {
	STREAK_7: "7-Day Streak",
	STREAK_30: "30-Day Streak",
	STREAK_100: "100-Day Streak",
	STREAK_365: "365-Day Streak",
	SOLVED_1: "First Solve",
	SOLVED_10: "10 Problems",
	SOLVED_50: "50 Problems",
	SOLVED_100: "100 Problems",
	NC250_COMPLETE: "250 — Roadmap Done",
	NC150_COMPLETE: "150 — Roadmap Done",
	BLIND75_COMPLETE: "75 — Roadmap Done",
	FIRST_SOLVER_1: "First Solver ×1",
	FIRST_SOLVER_10: "First Solver ×10",
	FIRST_SOLVER_50: "First Solver ×50",
	CONSISTENT_30: "Consistent 30",
}

interface BadgeEarnedEmailProps {
	name: string
	badgeType: string
	dashboardUrl: string
}

export default function BadgeEarnedEmail({
	name,
	badgeType,
	dashboardUrl,
}: BadgeEarnedEmailProps) {
	const label = BADGE_LABELS[badgeType] ?? badgeType

	return (
		<Html>
			<Head />
			<Preview>You earned the {label} badge on PSTrack</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {name},</Text>
					<Text style={paragraph}>
						You earned the <strong>{label}</strong> badge. Keep showing up.
					</Text>
					<Text style={link}>
						<a href={dashboardUrl} style={anchor}>
							View your profile →
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
