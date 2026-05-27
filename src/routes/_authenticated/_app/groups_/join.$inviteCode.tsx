import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useEffect } from "react"
import { sileo } from "sileo"

import { Skeleton } from "@/components/ui/skeleton"
import { useJoinByInvite } from "@/features/groups/hooks/use-group"

export const Route = createFileRoute("/_authenticated/_app/groups_/join/$inviteCode")({
	component: JoinByInvitePage,
})

function JoinByInvitePage() {
	const { inviteCode } = useParams({ strict: false }) as { inviteCode: string }
	const navigate = useNavigate()
	const joinMutation = useJoinByInvite()

	useEffect(() => {
		joinMutation.mutate(inviteCode, {
			onSuccess: (data) => {
				if (data?.groupId) {
					navigate({ to: `/groups/${data.groupId}` })
				} else {
					navigate({ to: "/groups" })
				}
			},
			onError: (err: unknown) => {
				sileo.error({
					title: "Invalid invite link",
					description: err instanceof Error ? err.message : "Please try again.",
				})
				navigate({ to: "/groups" })
			},
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [inviteCode, navigate, joinMutation.mutate])

	return (
		<div className="flex flex-col gap-6">
			<div>
				<p className="text-muted-foreground text-sm">Joining group…</p>
				<h1 className="mt-1 font-semibold text-3xl tracking-tight">Please wait</h1>
			</div>
			<Skeleton className="h-32 w-full" />
		</div>
	)
}
