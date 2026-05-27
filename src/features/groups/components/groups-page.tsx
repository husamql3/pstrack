import { zodResolver } from "@hookform/resolvers/zod"
import { IconCirclePlus, IconExternalLink, IconUsers } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { type CreateGroupFormInput, createGroupSchema } from "@/server/groups/groups.type"
import { useCreateGroup, useGroups, useRequestJoinGroup } from "../hooks/use-groups"

const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const GroupsPage = () => {
	const groupsQuery = useGroups()
	const createGroup = useCreateGroup()
	const requestJoin = useRequestJoinGroup()
	const form = useForm<CreateGroupFormInput>({
		resolver: zodResolver(createGroupSchema),
		defaultValues: { name: "", description: "" },
	})

	const onSubmit = form.handleSubmit(async (input) => {
		await sileo.promise(createGroup.mutateAsync(input), {
			loading: { title: "Creating group..." },
			success: { title: "Group created" },
			error: (err: unknown) => ({
				title: "Could not create group",
				description: errorDescription(err),
			}),
		})
		form.reset({ name: "", description: "" })
	})

	const joinGroup = async (groupId: string) => {
		await sileo.promise(requestJoin.mutateAsync(groupId), {
			loading: { title: "Requesting to join..." },
			success: { title: "Join request sent" },
			error: (err: unknown) => ({
				title: "Could not request access",
				description: errorDescription(err),
			}),
		})
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
			<section className="rounded-lg border border-border bg-background p-5">
				<div className="flex items-center gap-2">
					<IconCirclePlus className="size-4" />
					<h1 className="font-semibold">Create group</h1>
				</div>
				<form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							disabled={createGroup.isPending}
							placeholder="Morning grinders"
							{...form.register("name")}
						/>
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
							disabled={createGroup.isPending}
							placeholder="Daily practice with people who show up."
							{...form.register("description")}
						/>
					</div>
					<Button disabled={createGroup.isPending} type="submit">
						Create public group
					</Button>
				</form>
			</section>

			<section className="flex flex-col gap-4">
				<div>
					<p className="text-muted-foreground text-sm">Find accountability</p>
					<h2 className="font-semibold text-2xl tracking-tight">Public groups</h2>
				</div>

				{groupsQuery.isLoading && (
					<div className="grid gap-3">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				)}

				{groupsQuery.data?.length === 0 && (
					<div className="rounded-lg border border-border bg-background p-6 text-center">
						<IconUsers className="mx-auto size-6 text-muted-foreground" />
						<p className="mt-2 font-medium text-sm">No groups yet</p>
						<p className="mt-1 text-muted-foreground text-sm">
							Create the first one and today's problem can start flowing.
						</p>
					</div>
				)}

				<div className="grid gap-3">
					{groupsQuery.data?.map((group) => (
						<div
							className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4 md:flex-row md:items-center md:justify-between"
							key={group.id}
						>
							<div className="min-w-0">
								<div className="flex flex-wrap items-center gap-2">
									<h3 className="font-medium">{group.name}</h3>
									<Badge variant="outline">
										{group._count.members}/{group.maxMembers}
									</Badge>
									{group.membershipStatus !== "NONE" && (
										<Badge variant="secondary">
											{group.membershipStatus === "JOINED" ? "Joined" : "Requested"}
										</Badge>
									)}
								</div>
								{group.description && (
									<p className="mt-1 text-muted-foreground text-sm">
										{group.description}
									</p>
								)}
							</div>
							{group.membershipStatus === "JOINED" ? (
								<Button asChild variant="outline">
									<Link params={{ groupId: group.id }} to="/groups/$groupId">
										<IconExternalLink className="size-4" />
										View group
									</Link>
								</Button>
							) : (
								<Button
									disabled={
										group.membershipStatus !== "NONE" ||
										requestJoin.isPending ||
										group._count.members >= group.maxMembers
									}
									onClick={() => joinGroup(group.id)}
									variant="outline"
								>
									{group.membershipStatus === "REQUESTED"
										? "Requested"
										: "Request to join"}
								</Button>
							)}
						</div>
					))}
				</div>
			</section>
		</div>
	)
}
