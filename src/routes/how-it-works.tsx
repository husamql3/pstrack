import { createFileRoute } from "@tanstack/react-router"

import { Header } from "@/features/home/header"
import { createSeoHead } from "@/lib/seo"
import HowItWorksMdx from "../content/how-it-works.mdx"

const TITLE = "How PStrack Works — Daily LeetCode Accountability"
const DESCRIPTION =
	"PStrack assigns one LeetCode problem per day, auto-verifies your submission against the LeetCode API, and tracks your streak inside a study group. Here's exactly how it works."

export const Route = createFileRoute("/how-it-works")({
	component: HowItWorksPage,
	head: () =>
		createSeoHead({
			title: TITLE,
			description: DESCRIPTION,
			path: "/how-it-works",
		}),
})

function HowItWorksPage() {
	return (
		<div className="min-h-dvh bg-background">
			<Header />
			<main className="mx-auto max-w-2xl px-6 pt-32 pb-24">
				<article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight">
					<HowItWorksMdx />
				</article>
			</main>
		</div>
	)
}
