import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/admin/groups/$groupId/")({
	beforeLoad: ({ params }) => {
		throw redirect({
			to: "/admin/groups/$groupId/join-requests",
			params: { groupId: params.groupId },
		})
	},
})
