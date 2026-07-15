import { Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

export type OtpType =
	| "sign-in"
	| "email-verification"
	| "forget-password"
	| "change-email"

interface OtpCodeEmailProps {
	otp: string
	type: OtpType
}

const COPY: Record<OtpType, { heading: string; para: string; preview: string }> = {
	"sign-in": {
		heading: "Your sign-in code",
		para: "Enter this code to sign in to PStrack. It expires in 5 minutes.",
		preview: "Your PStrack sign-in code (expires in 5 min)",
	},
	"email-verification": {
		heading: "Confirm it's you",
		para: "Enter this code to confirm your identity before changing your email. It expires in 5 minutes.",
		preview: "Your PStrack verification code (expires in 5 min)",
	},
	"forget-password": {
		heading: "Reset your password",
		para: "Enter this code to reset your PStrack password. It expires in 5 minutes.",
		preview: "Your PStrack password reset code (expires in 5 min)",
	},
	"change-email": {
		heading: "Verify your new email",
		para: "Enter this code to confirm this is your new PStrack email address. It expires in 5 minutes.",
		preview: "Confirm your new PStrack email (code expires in 5 min)",
	},
}

export default function OtpCodeEmail({ otp, type }: OtpCodeEmailProps) {
	const copy = COPY[type] ?? COPY["email-verification"]
	return (
		<EmailLayout
			preview={copy.preview}
			note="Didn't request this? You can safely ignore this email — nothing will change."
			footerText="PStrack - Show up. Solve. Repeat."
		>
			<Text style={s.heading}>{copy.heading}</Text>
			<Text style={s.para}>{copy.para}</Text>
			<Section style={s.ctaSection}>
				<Text style={code}>{otp}</Text>
			</Section>
		</EmailLayout>
	)
}

const code = {
	fontSize: "34px",
	fontWeight: "700" as const,
	letterSpacing: "10px",
	color: "#18181b",
	fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
	backgroundColor: "#f4f4f5",
	borderRadius: "8px",
	padding: "16px 24px",
	margin: "0",
	display: "inline-block",
	textAlign: "center" as const,
}
