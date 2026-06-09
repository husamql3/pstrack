import { createFileRoute } from "@tanstack/react-router"

import { ClientDither } from "@/components/client-dither"
import { Footer } from "@/features/home/footer"
import { Header } from "@/features/home/header"
import { Hero } from "@/features/home/hero"
import { createSeoHead, siteUrl } from "@/lib/seo"

const HOME_TITLE = "LeetCode Accountability with Daily Problems & Study Groups"
const HOME_DESCRIPTION =
	"PStrack is the accountability layer for the NeetCode 250, NeetCode 150, and Blind 75 roadmaps. Solve one LeetCode problem a day, auto-verified against the LeetCode API, build streaks, and compete with study groups. Free tier; $14 lifetime Pro."

const homeSchema = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "Organization",
			"@id": `${siteUrl}/#organization`,
			name: "PStrack",
			url: siteUrl,
			logo: `${siteUrl}/logo-dark.png`,
		},
		{
			"@type": "WebSite",
			"@id": `${siteUrl}/#website`,
			url: siteUrl,
			name: "PStrack",
			description: HOME_DESCRIPTION,
			publisher: { "@id": `${siteUrl}/#organization` },
			inLanguage: "en-US",
		},
		{
			"@type": "SoftwareApplication",
			"@id": `${siteUrl}/#app`,
			name: "PStrack",
			url: siteUrl,
			applicationCategory: "EducationalApplication",
			applicationSubCategory: "Coding Interview Prep",
			operatingSystem: "Web",
			description: HOME_DESCRIPTION,
			offers: [
				{
					"@type": "Offer",
					name: "Free",
					price: "0",
					priceCurrency: "USD",
					category: "Free",
				},
				{
					"@type": "Offer",
					name: "Pro (Lifetime)",
					price: "14",
					priceCurrency: "USD",
					category: "OneTime",
				},
			],
		},
	],
}

export const Route = createFileRoute("/")({
	component: App,
	ssr: true,
	head: () =>
		createSeoHead({
			title: HOME_TITLE,
			description: HOME_DESCRIPTION,
			path: "/",
			schema: homeSchema,
		}),
})

function App() {
	return (
		<div className="relative h-dvh overflow-hidden bg-zinc-900">
			<div className="absolute inset-0">
				<ClientDither
					waveColor={[0.30980392156862746, 0.30980392156862746, 0.30980392156862746]}
					disableAnimation={false}
					enableMouseInteraction
					mouseRadius={0.3}
					colorNum={4}
					pixelSize={2}
					waveAmplitude={0.3}
					waveFrequency={3}
					waveSpeed={0.03}
				/>
			</div>

			<Header />
			<Hero />
			<Footer />
		</div>
	)
}
