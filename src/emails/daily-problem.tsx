import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

interface DailyProblemEmailProps {
	name: string
	groupName: string
	problemTitle: string
	difficulty: string
	topic: string
	problemUrl: string
	dashboardUrl: string
}

export default function DailyProblemEmail({
	name,
	groupName,
	problemTitle,
	difficulty,
	topic,
	problemUrl,
	dashboardUrl,
}: DailyProblemEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Today&apos;s problem: {problemTitle}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {name},</Text>
					<Text style={paragraph}>
						Your daily problem in <strong>{groupName}</strong> is ready.
					</Text>
					<Text style={problemBox}>
						<strong>{problemTitle}</strong>
						<br />
						{difficulty} &middot; {topic}
					</Text>
					<Button href={problemUrl} style={button}>
						Open in LeetCode
					</Button>
					<Text style={paragraph}>
						When you&apos;re done, head to your dashboard to mark it solved.
					</Text>
					<Button href={dashboardUrl} style={buttonSecondary}>
						View dashboard
					</Button>
					<Text style={footer}>Show up. Solve. Repeat.</Text>
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
const problemBox = {
	fontSize: "16px",
	color: "#0a0a0a",
	lineHeight: "24px",
	padding: "16px",
	backgroundColor: "#f6f6f6",
	borderRadius: "6px",
	margin: "16px 0",
}
const button = {
	backgroundColor: "#0a0a0a",
	color: "#ffffff",
	padding: "12px 24px",
	borderRadius: "6px",
	fontSize: "15px",
	fontWeight: "600",
	textDecoration: "none",
	display: "inline-block",
}
const buttonSecondary = {
	...button,
	backgroundColor: "#ffffff",
	color: "#0a0a0a",
	border: "1px solid #e5e5e5",
	marginTop: "12px",
}
const footer = { fontSize: "13px", color: "#888888", marginTop: "24px" }
