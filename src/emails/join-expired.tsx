import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

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
		<Html>
			<Head />
			<Preview>Your request to join {groupName} expired</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {name},</Text>
					<Text style={paragraph}>
						Your request to join <strong>{groupName}</strong> expired after 24 hours
						without a response. You can request to join again, or find another group.
					</Text>
					<Button href={browseUrl} style={button}>
						Browse groups
					</Button>
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
