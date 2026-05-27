import { zodResolver } from "@hookform/resolvers/zod"
import {
	IconCheck,
	IconClipboard,
	IconLink,
	IconLinkOff,
	IconLoader2,
} from "@tabler/icons-react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { env } from "@/env"
import { type UpdateGroupFormInput, updateGroupSchema } from "@/server/groups/groups.type"
import {
	useGenerateInvite,
	useGroup,
	useLeaveGroup,
	useRevokeInvite,
	useUpdateGroup,
} from "../hooks/use-group"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const GroupSettings = () => {
	const { groupId } = useParams({ strict: false }) as { groupId: string }
	const groupQuery = useGroup(groupId)
	const navigate = useNavigate()

	if (groupQuery.isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		)
	}

	if (!groupQuery.data) return null

	const group = groupQuery.data

	if (group.userRole !== "ADMIN") {
		return (
			<div className="rounded-lg border border-border bg-background p-6">
				<p className="font-medium text-sm">Admin access required.</p>
				<p className="mt-1 text-muted-foreground text-sm">
					Only group admins can view settings.
				</p>
			</div>
		)
	}

	return (
		<div className="flex max-w-lg flex-col gap-8">
			<UpdateGroupForm groupId={groupId} />
			<Separator />
			<InviteLinkSection
				groupId={groupId}
				inviteCode={group.inviteCode}
				inviteExpiresAt={group.inviteExpiresAt ? new Date(group.inviteExpiresAt) : null}
			/>
			<Separator />
			<DangerZone groupId={groupId} onLeft={() => navigate({ to: "/groups" })} />
		</div>
	)
}

const UpdateGroupForm = ({ groupId }: { groupId: string }) => {
	const groupQuery = useGroup(groupId)
	const updateGroup = useUpdateGroup(groupId)
	const group = groupQuery.data!

	const form = useForm<UpdateGroupFormInput>({
		resolver: zodResolver(updateGroupSchema),
		defaultValues: { name: group.name, description: group.description ?? "" },
	})

	const onSubmit = form.handleSubmit(async (input) => {
		await sileo.promise(updateGroup.mutateAsync(input), {
			loading: { title: "Saving..." },
			success: { title: "Settings saved" },
			error: (err: unknown) => ({
				title: "Could not save settings",
				description: errorDescription(err),
			}),
		})
	})

	return (
		<section>
			<h2 className="font-semibold">Group details</h2>
			<form className="mt-4 flex flex-col gap-4" onSubmit={onSubmit}>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="name">Name</Label>
					<Input id="name" disabled={updateGroup.isPending} {...form.register("name")} />
					{form.formState.errors.name && (
						<p className="text-destructive text-xs">
							{form.formState.errors.name.message}
						</p>
					)}
				</div>
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="description">Description</Label>
					<Textarea
						id="description"
						disabled={updateGroup.isPending}
						placeholder="Describe your group…"
						{...form.register("description")}
					/>
				</div>
				<div>
					<Button disabled={updateGroup.isPending} type="submit">
						{updateGroup.isPending && (
							<IconLoader2 className="mr-2 size-4 animate-spin" />
						)}
						Save changes
					</Button>
				</div>
			</form>
		</section>
	)
}

const EXPIRY_OPTIONS = [
	{ label: "7 days", value: "7d" as const },
	{ label: "30 days", value: "30d" as const },
	{ label: "90 days", value: "90d" as const },
	{ label: "Never expires", value: "never" as const },
]

const InviteLinkSection = ({
	groupId,
	inviteCode,
	inviteExpiresAt,
}: {
	groupId: string
	inviteCode: string | null
	inviteExpiresAt: Date | null
}) => {
	const generateInvite = useGenerateInvite(groupId)
	const revokeInvite = useRevokeInvite(groupId)
	const [copied, setCopied] = useState(false)

	const inviteUrl = inviteCode ? `${env.VITE_BASE_URL}/groups/join/${inviteCode}` : null

	const handleGenerate = async (expiresIn: "7d" | "30d" | "90d" | "never") => {
		await sileo.promise(generateInvite.mutateAsync({ expiresIn }), {
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
								<IconCheck className="size-4 text-green-500" />
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

const DangerZone = ({ groupId, onLeft }: { groupId: string; onLeft: () => void }) => {
	const leaveGroup = useLeaveGroup(groupId)

	const handleLeave = async () => {
		await sileo.promise(leaveGroup.mutateAsync(), {
			loading: { title: "Leaving group..." },
			success: { title: "Left group" },
			error: (err: unknown) => ({
				title: "Could not leave group",
				description: errorDescription(err),
			}),
		})
		onLeft()
	}

	return (
		<section>
			<h2 className="font-semibold text-destructive">Danger zone</h2>
			<p className="mt-1 text-muted-foreground text-sm">
				Leaving as the last admin will disband the group.
			</p>
			<Button
				className="mt-4"
				disabled={leaveGroup.isPending}
				onClick={handleLeave}
				variant="destructive"
			>
				Leave group
			</Button>
		</section>
	)
}
