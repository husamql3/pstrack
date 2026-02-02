import { TanStackDevtools } from "@tanstack/react-devtools";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import appCss from "../styles.css?url";
// import { createServerFn } from "@tanstack/react-start";
// import { auth } from "@/lib/auth";

// const getSession = createServerFn({ method: "GET" }).handler(async () => {
// 	const { data, error } = await auth.getSession();
// 	if (error || !data?.session) {
// 		return { session: null, user: null };
// 	}
// 	console.log("[__root.tsx] Session data:", data);
// 	return {
// 		session: data.session,
// 		user: data.user
// 	};
// })

export const Route = createRootRoute({
	// beforeLoad: async () => {
	// 	const sessionData = await getSession();
	// 	return sessionData;
	// },
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
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="dark">
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
	);
}
