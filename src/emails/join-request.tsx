import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

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
		<Html>
			<Head />
			<Preview>
				{requesterName} requested to join {groupName}
			</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {adminName},</Text>
					<Text style={paragraph}>
						<strong>{requesterName}</strong> has requested to join your group{" "}
						<strong>{groupName}</strong>. Review and approve or reject the request.
					</Text>
					<Button href={reviewUrl} style={button}>
						Review request
					</Button>
					<Text style={footer}>Requests expire after 24 hours if not reviewed.</Text>
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
const footer = { fontSize: "13px", color: "#888888", marginTop: "24px" }
