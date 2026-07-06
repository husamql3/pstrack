import {
	IconCheck,
	IconClipboard,
	IconLink,
	IconLinkOff,
	IconPlayerPlay,
} from "@tabler/icons-react"
import { useParams } from "@tanstack/react-router"
import { useState } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { env } from "@/env"
import { ROADMAP_TOTALS } from "@/features/problems/constants"
import {
	useAdminGenerateInvite,
	useAdminGroup,
	useAdminRevokeInvite,
	useAdminStartGroup,
} from "../hooks/use-admin-group"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

const EXPIRY_OPTIONS = [
	{ label: "7 days", value: "7d" as const },
	{ label: "30 days", value: "30d" as const },
	{ label: "90 days", value: "90d" as const },
	{ label: "Never expires", value: "never" as const },
]

export const AdminGroupSettings = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const { data, isLoading } = useAdminGroup(groupId)

	if (isLoading || !data) return <Skeleton className="h-48 w-full" />

	return (
		<div className="flex max-w-2xl flex-col gap-8">
			<GroupStartSection
				groupId={groupId}
				isActive={data.isActive}
				isStarted={data.isStarted}
			/>
			<Separator />
			<InviteLinkSection
				groupId={groupId}
				inviteCode={data.inviteCode}
				inviteExpiresAt={data.inviteExpiresAt ? new Date(data.inviteExpiresAt) : null}
			/>
			<Separator />
			<GroupMetadata
				roadmap={data.roadmap}
				roadmapIndex={data.roadmapIndex}
				type={data.type}
				maxMembers={data.maxMembers}
				memberCount={data._count.members}
				createdAt={new Date(data.createdAt)}
			/>
		</div>
	)
}

const GroupStartSection = ({
	groupId,
	isActive,
	isStarted,
}: {
	groupId: string
	isActive: boolean
	isStarted: boolean
}) => {
	const startGroup = useAdminStartGroup(groupId)

	const handleStart = async () => {
		await sileo.promise(startGroup.mutateAsync(), {
			loading: { title: "Starting group..." },
			success: { title: "Group started" },
			error: (err: unknown) => ({
				title: "Could not start group",
				description: errorDescription(err),
			}),
		})
	}

	return (
		<section>
			<h2 className="font-semibold">Daily problems</h2>
			<p className="mt-1 max-w-xl text-muted-foreground text-sm">
				{isStarted
					? "This group is eligible for the midnight UTC daily assignment."
					: "This group is visible and joinable, but daily assignments have not started."}
			</p>
			{!isStarted ? (
				<Button
					className="mt-4"
					disabled={!isActive || startGroup.isPending}
					onClick={handleStart}
					size="sm"
				>
					<IconPlayerPlay className="size-4" />
					Start at next cron
				</Button>
			) : null}
		</section>
	)
}

const InviteLinkSection = ({
	groupId,
	inviteCode,
	inviteExpiresAt,
}: {
	groupId: string
	inviteCode: string | null
	inviteExpiresAt: Date | null
}) => {
	const generateInvite = useAdminGenerateInvite(groupId)
	const revokeInvite = useAdminRevokeInvite(groupId)
	const [copied, setCopied] = useState(false)

	const inviteUrl = inviteCode ? `${env.VITE_BASE_URL}/groups/join/${inviteCode}` : null

	const handleGenerate = async (expiresIn: "7d" | "30d" | "90d" | "never") => {
		await sileo.promise(generateInvite.mutateAsync(expiresIn), {
			loading: { title: "Generating link..." },
			success: { title: "Invite link generated" },
			error: (err: unknown) => ({
				title: "Could not generate link",
				description: errorDescription(err),
			}),
		})
	}

	const handleRevoke = async () => {
		await sileo.promise(revokeInvite.mutateAsync(), {
			loading: { title: "Revoking link..." },
			success: { title: "Invite link revoked" },
			error: (err: unknown) => ({
				title: "Could not revoke link",
				description: errorDescription(err),
			}),
		})
	}

	const handleCopy = async () => {
		if (!inviteUrl) return
		await navigator.clipboard.writeText(inviteUrl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<section>
			<h2 className="font-semibold">Invite link</h2>
			<p className="mt-1 text-muted-foreground text-sm">
				Anyone with the link can join this group instantly.
			</p>

			{inviteUrl ? (
				<div className="mt-4 flex flex-col gap-3">
					<div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
						<span className="min-w-0 flex-1 truncate font-mono text-muted-foreground text-xs">
							{inviteUrl}
						</span>
						<Button onClick={handleCopy} size="sm" variant="ghost">
							{copied ? (
								<IconCheck className="size-4" />
							) : (
								<IconClipboard className="size-4" />
							)}
						</Button>
					</div>
					{inviteExpiresAt && (
						<p className="text-muted-foreground text-xs">
							Expires {inviteExpiresAt.toLocaleDateString()}
						</p>
					)}
					<div className="flex gap-2">
						<Button
							disabled={generateInvite.isPending || revokeInvite.isPending}
							onClick={() => handleGenerate("never")}
							size="sm"
							variant="outline"
						>
							<IconLink className="size-4" />
							Regenerate
						</Button>
						<Button
							disabled={revokeInvite.isPending || generateInvite.isPending}
							onClick={handleRevoke}
							size="sm"
							variant="outline"
						>
							<IconLinkOff className="size-4" />
							Revoke
						</Button>
					</div>
				</div>
			) : (
				<div className="mt-4 flex flex-wrap gap-2">
					{EXPIRY_OPTIONS.map((opt) => (
						<Button
							disabled={generateInvite.isPending}
							key={opt.value}
							onClick={() => handleGenerate(opt.value)}
							size="sm"
							variant="outline"
						>
							{opt.label}
						</Button>
					))}
				</div>
			)}
		</section>
	)
}

const GroupMetadata = ({
	roadmap,
	roadmapIndex,
	type,
	maxMembers,
	memberCount,
	createdAt,
}: {
	roadmap: string
	roadmapIndex: number
	type: string
	maxMembers: number
	memberCount: number
	createdAt: Date
}) => {
	const total = ROADMAP_TOTALS[roadmap]
	return (
		<section>
			<h2 className="font-semibold">Details</h2>
			<dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
				<dt className="text-muted-foreground">Roadmap</dt>
				<dd className="font-medium">{roadmap}</dd>
				<dt className="text-muted-foreground">Progress</dt>
				<dd className="font-medium tabular-nums">
					{roadmapIndex} / {total}
				</dd>
				<dt className="text-muted-foreground">Type</dt>
				<dd className="font-medium">{type.toLowerCase()}</dd>
				<dt className="text-muted-foreground">Capacity</dt>
				<dd className="font-medium tabular-nums">
					{memberCount} / {maxMembers}
				</dd>
				<dt className="text-muted-foreground">Created</dt>
				<dd className="font-medium">{createdAt.toLocaleDateString()}</dd>
			</dl>
		</section>
	)
}
