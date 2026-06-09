import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components"

interface WelcomeEmailProps {
	name: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
	return (
		<Html>
			<Head />
			<Preview>Welcome to PStrack - your streak starts today</Preview>
			<Body style={body}>
				<Container style={container}>
					<Section style={logoSection}>
						<Img
							src="https://pstrack.app/logo-light.png"
							width="150"
							alt="PStrack"
							style={logoImg}
						/>
					</Section>

					<Text style={heading}>Hey {name}, you made it.</Text>
					<Text style={para}>
						We&apos;re glad you&apos;re here. PStrack gives you one problem a day, a group
						to stay accountable with, and a streak worth protecting. It&apos;s simple -
						and it works.
					</Text>

					<Section style={ctaRow}>
						<Button href="https://pstrack.app/groups" style={button}>
							Find Your Group
						</Button>
					</Section>

					<Hr style={rule} />

					<Text style={note}>
						You&apos;re receiving this because you just signed up for PStrack. If this
						wasn&apos;t you, you can safely ignore this email.
					</Text>

					<Section style={taglineBox}>
						<Text style={tagline}>Show up. Solve. Repeat.</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

const fontStack =
	"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

const body = {
	backgroundColor: "#f4f4f5",
	fontFamily: fontStack,
	margin: "0",
	padding: "0",
}

const container = {
	margin: "40px auto",
	padding: "40px 32px 32px",
	maxWidth: "480px",
	backgroundColor: "#ffffff",
	borderRadius: "12px",
	textAlign: "center" as const,
}

const logoSection = {
	marginBottom: "32px",
}

const logoImg = {
	display: "block",
	margin: "0 auto",
}

const heading = {
	fontSize: "24px",
	fontWeight: "700" as const,
	color: "#18181b",
	lineHeight: "32px",
	margin: "0 0 12px",
	textAlign: "center" as const,
}

const para = {
	fontSize: "16px",
	color: "#52525b",
	lineHeight: "26px",
	margin: "0 0 28px",
	textAlign: "center" as const,
}

const ctaRow = {
	textAlign: "center" as const,
	marginBottom: "28px",
}

const button = {
	backgroundColor: "#047857",
	color: "#f0fdf4",
	padding: "13px 28px",
	borderRadius: "8px",
	fontSize: "15px",
	fontWeight: "600" as const,
	textDecoration: "none",
	display: "inline-block",
}

const rule = {
	border: "none",
	borderTop: "1px solid #e4e4e7",
	margin: "0 0 20px",
}

const note = {
	fontSize: "13px",
	color: "#71717a",
	lineHeight: "20px",
	margin: "0 0 20px",
	textAlign: "center" as const,
}

const taglineBox = {
	backgroundColor: "#f4f4f5",
	borderRadius: "8px",
	padding: "14px 20px",
}

const tagline = {
	fontSize: "13px",
	color: "#71717a",
	lineHeight: "20px",
	margin: "0",
	textAlign: "center" as const,
	fontStyle: "italic" as const,
}
