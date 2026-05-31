import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/_app/help")({
	component: HelpPage,
})

function HelpPage() {
	return (
		<div className="mx-auto flex w-full max-w-2xl flex-col gap-3 py-12">
			<h1 className="font-semibold text-2xl tracking-tight">Help &amp; FAQ</h1>
			<p className="text-muted-foreground text-sm">
				We're putting together answers to the most common questions about streaks,
				verification, groups, and Pro. This page will fill in soon.
			</p>
		</div>
	)
}
