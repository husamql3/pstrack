import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

interface MagicLinkEmailProps {
	url: string
}

export default function MagicLinkEmail({ url }: MagicLinkEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Your PSTrack sign-in link</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>PSTrack</Text>
					<Text style={paragraph}>
						Click the button below to sign in. This link expires in 15 minutes.
					</Text>
					<Button href={url} style={button}>
						Sign in to PSTrack
					</Button>
					<Text style={footer}>
						If you didn&apos;t request this, you can safely ignore this email.
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
