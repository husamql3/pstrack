import {
	Body,
	Button,
	Container,
	Head,
	Html,
	Preview,
	Text,
} from "@react-email/components"

interface WelcomeEmailProps {
	name: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Welcome to PSTrack — Show up. Solve. Repeat.</Preview>
			<Body style={body}>
				<Container style={container}>
					<Text style={heading}>Welcome to PSTrack, {name}.</Text>
					<Text style={paragraph}>
						You&apos;re all set. Join a group, get your daily problem, and start your
						streak.
					</Text>
					<Button href="https://pstrack.app/dashboard" style={button}>
						Go to Dashboard
					</Button>
					<Text style={footer}>Show up. Solve. Repeat. &mdash; The PSTrack team</Text>
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
