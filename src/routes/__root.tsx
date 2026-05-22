import { TanStackDevtools } from "@tanstack/react-devtools"
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import type { ReactNode } from "react"
import { Toaster } from "sileo"

import { authClient } from "@/lib/auth-client"
import appCss from "../styles.css?url"

export const Route = createRootRouteWithContext<{}>()({
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
				title: "PStrack",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
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
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				<Toaster position="top-center" />
				{children}
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
