import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Preview,
	Section,
	Text,
} from "@react-email/components"
import type { ReactNode } from "react"

const fontStack =
	"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

export function EmailLayout({
	preview,
	children,
	note = "You're receiving this because you have an account on PSTrack.",
	footerText = "Show up. Solve. Repeat.",
}: {
	preview: string
	children: ReactNode
	note?: string
	footerText?: string
}) {
	return (
		<Html>
			<Head />
			<Preview>{preview}</Preview>
			<Body style={body}>
				<Container style={container}>
					<Section style={logoSection}>
						<Img
							src="https://pstrack.app/logo-dark.png"
							width="56"
							height="56"
							alt="PSTrack"
							style={logoImg}
						/>
					</Section>

					{children}

					<Hr style={rule} />

					<Text style={noteStyle}>{note}</Text>

					<Section style={taglineBox}>
						<Text style={tagline}>{footerText}</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	)
}

export const s = {
	heading: {
		fontSize: "24px",
		fontWeight: "700" as const,
		color: "#18181b",
		lineHeight: "32px",
		margin: "0 0 12px",
		textAlign: "center" as const,
	},
	para: {
		fontSize: "16px",
		color: "#52525b",
		lineHeight: "26px",
		margin: "0 0 24px",
		textAlign: "center" as const,
	},
	ctaSection: {
		textAlign: "center" as const,
		marginBottom: "28px",
	},
	ctaGreen: {
		backgroundColor: "#047857",
		color: "#f0fdf4",
		padding: "13px 28px",
		borderRadius: "8px",
		fontSize: "15px",
		fontWeight: "600" as const,
		textDecoration: "none",
		display: "inline-block",
	},
	ctaDark: {
		backgroundColor: "#18181b",
		color: "#fafafa",
		padding: "13px 28px",
		borderRadius: "8px",
		fontSize: "15px",
		fontWeight: "600" as const,
		textDecoration: "none",
		display: "inline-block",
	},
	ctaOutline: {
		backgroundColor: "#ffffff",
		color: "#18181b",
		border: "1px solid #e4e4e7",
		padding: "12px 28px",
		borderRadius: "8px",
		fontSize: "15px",
		fontWeight: "600" as const,
		textDecoration: "none",
		display: "inline-block",
		marginTop: "10px",
	},
	link: {
		color: "#047857",
		fontWeight: "600" as const,
		textDecoration: "none",
	},
	highlight: {
		backgroundColor: "#f4f4f5",
		borderRadius: "8px",
		padding: "14px 18px",
		margin: "0 0 24px",
		textAlign: "left" as const,
	},
	highlightTitle: {
		fontSize: "16px",
		fontWeight: "700" as const,
		color: "#18181b",
		lineHeight: "24px",
		margin: "0 0 4px",
	},
	highlightMeta: {
		fontSize: "14px",
		color: "#71717a",
		lineHeight: "20px",
		margin: "0",
	},
}

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
	marginBottom: "24px",
}

const logoImg = {
	borderRadius: "12px",
	display: "block",
	margin: "0 auto",
}

const rule = {
	border: "none",
	borderTop: "1px solid #e4e4e7",
	margin: "0 0 20px",
}

const noteStyle = {
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
