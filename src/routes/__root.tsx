import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import type { ReactNode } from "react"
import { Toaster } from "sileo"

import { authClient } from "@/lib/auth-client"
import appCss from "../styles.css?url"
import { getQueryClient } from "@/lib/query-client"
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	beforeLoad: async () => {
		const { data: session } = await authClient.getSession()
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
			{
				title: "pstrack",
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
	notFoundComponent: () => <div>Not Found!</div>,
	pendingComponent: () => <div>Loading...</div>,
	errorComponent: () => <div>Error!</div>,
	shellComponent: RootDocument,
	ssr: false,
})

function RootDocument({ children }: { children: ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<html lang="en">
			<head>
				<HeadContent />
				{/* Runs before paint to prevent theme flash */}
				<script
					dangerouslySetInnerHTML={{
						__html: `(function(){var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches)){d.classList.add('dark')}})()`,
					}}
				/>
			</head>
			<body suppressHydrationWarning>
				<Toaster position="top-center" />
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	)
}
