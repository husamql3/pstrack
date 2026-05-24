import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/_app/groups")({
	component: RouteComponent,
})

function RouteComponent() {
	return <div>Hello "/_authenticated/_app/groups"!</div>
}
