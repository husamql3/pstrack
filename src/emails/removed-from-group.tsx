import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

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
		<Html>
			<Head />
			<Preview>You've been removed from {groupName}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>Hi {name},</Text>
					<Text style={paragraph}>
						You have been removed from <strong>{groupName}</strong>. Your points and
						streak are unaffected. Browse other groups to continue your streak.
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
