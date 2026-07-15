import { TanStackDevtools } from "@tanstack/react-devtools"
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import type { ReactNode } from "react"
import { Toaster } from "sileo"

import { ErrorPage } from "@/components/error"
import { NotFoundPage } from "@/components/not-found"
import { Spinner } from "@/components/ui/spinner"
import { getQueryClient } from "@/lib/query-client"
import { sessionQueryOptions } from "@/lib/session"
import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	// beforeLoad re-runs on every navigation (and every hover preload). Reading
	// the session through the query cache keeps repeat navigations off the
	// network — the uncached fetch here was the navbar lag in #231.
	beforeLoad: async ({ context }) => {
		const session = await context.queryClient.ensureQueryData(sessionQueryOptions)
		return { session }
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "/favicon-light.ico",
				media: "(prefers-color-scheme: light)",
			},
			{
				rel: "icon",
				href: "/favicon-dark.ico",
				media: "(prefers-color-scheme: dark)",
			},
		],
	}),
	notFoundComponent: () => <NotFoundPage />,
	pendingComponent: () => (
		<div className="flex h-dvh items-center justify-center">
			<Spinner size="size-8" />
		</div>
	),
	errorComponent: () => <ErrorPage />,
	shellComponent: RootDocument,
	ssr: true,
})

function RootDocument({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<html suppressHydrationWarning lang="en" className="scheme-only-dark">
			<head>
				<HeadContent />
				{/* Runs before paint to prevent theme flash */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: inline theme-init script must run before paint
					dangerouslySetInnerHTML={{
						__html: `(function(){var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark')}})()`,
					}}
				/>
			</head>
			<body suppressHydrationWarning>
				<Toaster position="top-center" />
				<QueryClientProvider client={queryClient}>
					{children}
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "TanStack Query",
								render: <ReactQueryDevtoolsPanel />,
							},
							{
								name: "TanStack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				</QueryClientProvider>
				<Analytics debug={false} />
				<SpeedInsights />
				<Scripts />
			</body>
		</html>
	)
}
