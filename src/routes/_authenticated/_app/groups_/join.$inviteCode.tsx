import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router"
import { useEffect } from "react"
import { sileo } from "sileo"

import { Skeleton } from "@/components/ui/skeleton"
import { useJoinByInvite } from "@/features/groups/hooks/use-group"
import { ProFeatureError } from "@/lib/errors"

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
				if (err instanceof ProFeatureError) {
					sileo.error({
						title: "Group limit reached",
						description: "You can only be in one group right now.",
					})
				} else {
					sileo.error({
						title: "Invalid invite link",
						description: err instanceof Error ? err.message : "Please try again.",
					})
				}
				void navigate({ to: "/groups" })
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
