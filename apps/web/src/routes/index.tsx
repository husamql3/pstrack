import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

// https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing#directory-routes

function App() {
	return <h1>Hello World</h1>;
}
