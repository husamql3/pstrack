import { createFileRoute } from "@tanstack/react-router"

import { Header } from "@/features/home/header"
import { createSeoHead, siteUrl } from "@/lib/seo"

const ABOUT_TITLE = "How It Began — The Story Behind a $14 LeetCode Accountability Tool"
const ABOUT_DESCRIPTION =
	"The story behind PStrack: why a $14 lifetime LeetCode accountability tool exists, what it's trying to fix about coding interview prep, and who built it."

const aboutSchema = {
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "AboutPage",
			"@id": `${siteUrl}/about#aboutpage`,
			url: `${siteUrl}/about`,
			name: ABOUT_TITLE,
			description: ABOUT_DESCRIPTION,
			isPartOf: { "@id": `${siteUrl}/#website` },
			about: { "@id": `${siteUrl}/#app` },
		},
		{
			"@type": "Person",
			"@id": `${siteUrl}/about#founder`,
			name: "Hüsam",
			url: `${siteUrl}/about`,
			worksFor: { "@id": `${siteUrl}/#organization` },
		},
	],
}

export const Route = createFileRoute("/about")({
	component: AboutPage,
	head: () =>
		createSeoHead({
			title: ABOUT_TITLE,
			description: ABOUT_DESCRIPTION,
			path: "/about",
			schema: aboutSchema,
		}),
})

function AboutPage() {
	return (
		<div className="min-h-dvh bg-background">
			<Header />
			<main className="mx-auto max-w-2xl px-6 pt-32 pb-24">
				<article className="prose-headings:font-semibold prose-headings:tracking-tight">
					<h1 className="text-balance font-semibold text-4xl tracking-tight md:text-5xl">
						How PStrack began
					</h1>
					<p className="mt-6 text-balance text-lg text-muted-foreground">
						PStrack is the accountability layer for the NeetCode 250, NeetCode 150, and
						Blind 75 roadmaps. Show up. Solve. Repeat.
					</p>

					<Section title="The frustration">
						{/* TODO: 120-180 words. What was broken about coding interview prep
						    before PStrack — the LeetCode firehose, fizzling streaks, the loneliness
						    of grinding solo, the $99/yr subscriptions that punish you for taking a
						    break. */}
						<p>[Story section 1 — the frustration]</p>
					</Section>

					<Section title="The moment">
						{/* TODO: 120-180 words. A concrete origin scene: the day/week/realization
						    that made you build this. Specific is better than abstract — a date, a
						    place, a stuck streak, a friend in your group chat. */}
						<p>[Story section 2 — the origin moment]</p>
					</Section>

					<Section title="What it had to be">
						{/* TODO: 120-180 words. The design principles PStrack was built on:
						    - One problem a day, not a firehose
						    - Auto-verify against the actual LeetCode API
						    - Streaks that can be paused, not just broken
						    - Groups, because accountability beats willpower */}
						<p>[Story section 3 — design principles]</p>
					</Section>

					<Section title="Why $14, once">
						{/* TODO: 120-180 words. The pricing decision. Why a one-time $14 instead
						    of $9/mo or $99/yr. Who $99/yr is unaffordable for (students, early-
						    career devs, anyone in a non-US market). The anti-subscription stance. */}
						<p>[Story section 4 — pricing rationale]</p>
					</Section>

					<Section title="Who it's for">
						{/* TODO: 120-180 words. Imagined user: the dev who's already tried to grind
						    LeetCode three times, fallen off three times, and is starting again.
						    The student a month from their first technical interview. The senior
						    re-entering the market after years out. */}
						<p>[Story section 5 — who it's for]</p>
					</Section>

					<div className="mt-16 border-t pt-8 text-muted-foreground text-sm">
						<p>
							Built by Hüsam. Questions, feedback, or want to be one of the first 50 beta
							users?
						</p>
					</div>
				</article>
			</main>
		</div>
	)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="mt-12">
			<h2 className="font-semibold text-2xl tracking-tight">{title}</h2>
			<div className="mt-4 space-y-4 text-foreground/90 leading-relaxed">{children}</div>
		</section>
	)
}
