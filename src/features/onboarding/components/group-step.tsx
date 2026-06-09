import { IconUsers } from "@tabler/icons-react"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useMemo } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useGroups, useRequestJoinGroup } from "@/features/groups/hooks/use-groups"
import { GroupType } from "@/generated/prisma/enums"
import { ProFeatureError } from "@/lib/errors"
import { OnboardingGroupCard } from "./onboarding-group-card"

const CardSkeleton = () => (
	<div className="flex flex-col gap-3 rounded-xl border border-border p-4">
		<div className="flex items-start gap-3">
			<Skeleton className="size-10 rounded-xl" />
			<div className="flex flex-1 flex-col gap-1.5">
				<Skeleton className="h-3.5 w-32" />
				<Skeleton className="h-3 w-20" />
			</div>
		</div>
		<Skeleton className="h-9 w-full rounded-md" />
	</div>
)

export const GroupStep = ({ onBack }: { onBack: () => void }) => {
	const navigate = useNavigate()
	const groupsQuery = useGroups()
	const requestJoin = useRequestJoinGroup()

	const publicGroups = useMemo(
		() => (groupsQuery.data ?? []).filter((g) => g.type === GroupType.PUBLIC),
		[groupsQuery.data]
	)

	const handleJoin = useCallback(
		async (groupId: string) => {
			await sileo.promise(requestJoin.mutateAsync(groupId), {
				loading: { title: "Requesting to join..." },
				success: { title: "Join request sent!" },
				error: (err: unknown) => {
					if (err instanceof ProFeatureError) {
						return {
							title: "Group limit reached",
							description: "You can only be in one group right now.",
						}
					}
					return {
						title: "Could not request access",
						description: err instanceof Error ? err.message : "Please try again.",
					}
				},
			})
		},
		[requestJoin]
	)

	const finish = () => {
		sileo.success({ title: "Welcome to PStrack!" })
		navigate({ to: "/dashboard" })
	}

	return (
		<main className="flex flex-1 flex-col items-center px-4 py-16">
			<div className="flex w-full max-w-4xl flex-col gap-8">
				<div className="text-center">
					<h2 className="font-bold text-2xl tracking-tight">Join a group</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						Groups keep you accountable. You can always join one later.
					</p>
				</div>

				{groupsQuery.isPending ? (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{Array.from({ length: 4 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items have no stable id
							<CardSkeleton key={i} />
						))}
					</div>
				) : publicGroups.length === 0 ? (
					<div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-10 text-center">
						<IconUsers className="size-8 text-muted-foreground" />
						<p className="text-muted-foreground text-sm">
							No public groups available yet.
						</p>
						<p className="text-muted-foreground text-xs">
							You can create one later from the Groups page.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{publicGroups.map((group) => (
							<OnboardingGroupCard
								key={group.id}
								group={group}
								onJoin={handleJoin}
								isJoining={requestJoin.isPending}
							/>
						))}
					</div>
				)}

				<div className="flex gap-3">
					<Button variant="outline" onClick={onBack} className="flex-1">
						Back
					</Button>
					<Button onClick={finish} className="flex-1">
						Finish
					</Button>
				</div>
			</div>
		</main>
	)
}
