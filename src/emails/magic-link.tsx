import { Button, Section, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

interface MagicLinkEmailProps {
	url: string
}

export default function MagicLinkEmail({ url }: MagicLinkEmailProps) {
	return (
		<EmailLayout
			preview="Your PStrack sign-in link (expires in 15 min)"
			note="Didn't request this? You can safely ignore this email."
			footerText="PStrack - Show up. Solve. Repeat."
		>
			<Text style={s.heading}>Sign in to PStrack</Text>
			<Text style={s.para}>Your sign-in link is ready. It expires in 15 minutes.</Text>
			<Section style={s.ctaSection}>
				<Button href={url} style={s.ctaDark}>
					Sign in
				</Button>
			</Section>
		</EmailLayout>
	)
}
