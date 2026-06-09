import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { MeResponse } from "@/server/users/users.type"
import { useUpdateProfile } from "../../hooks/use-me"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

const schema = z.object({
	name: z.string().trim().min(1, { error: "Display name is required" }).max(80),
	bio: z
		.string()
		.trim()
		.max(280)
		.transform((s) => (s.length === 0 ? null : s))
		.nullable(),
	isPublic: z.boolean(),
})

type FormInput = z.infer<typeof schema>

export const BasicsSection = ({ me }: { me: MeResponse }) => {
	const updateProfile = useUpdateProfile()
	const form = useForm<FormInput>({
		resolver: zodResolver(schema),
		values: { name: me.name, bio: me.bio, isPublic: me.isPublic },
	})
	const { register, handleSubmit, control, formState } = form
	const isPending = updateProfile.isPending

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(updateProfile.mutateAsync(values), {
			loading: { title: "Saving profile..." },
			success: { title: "Profile saved" },
			error: (err) => ({
				title: "Couldn't save profile",
				description: errorDescription(err),
			}),
		})
	})

	return (
		<SectionCard
			title="Profile"
			description="The basics shown on your public profile and group leaderboards."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-5">
				<div className="grid gap-1.5">
					<Label htmlFor="name">Display name</Label>
					<Input
						id="name"
						{...register("name")}
						disabled={isPending}
						autoComplete="off"
						className="max-w-md"
					/>
					{formState.errors.name && (
						<p className="text-destructive text-xs">{formState.errors.name.message}</p>
					)}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="bio">Bio</Label>
					<Textarea
						id="bio"
						{...register("bio")}
						disabled={isPending}
						placeholder="A short blurb shown on your profile."
						rows={3}
						maxLength={280}
					/>
				</div>

				<div className="flex items-start gap-3 rounded-md border border-border p-3">
					<Controller
						control={control}
						name="isPublic"
						render={({ field }) => (
							<Checkbox
								id="isPublic"
								checked={field.value}
								onCheckedChange={(v) => field.onChange(v === true)}
								disabled={isPending}
								className="mt-0.5"
							/>
						)}
					/>
					<div className="flex flex-col gap-0.5">
						<Label htmlFor="isPublic" className="font-medium">
							Make my profile public
						</Label>
						<p className="text-muted-foreground text-xs">
							When off, pstrack.app/{me.username ?? "username"} shows a private
							placeholder.
						</p>
					</div>
				</div>

				<div>
					<Button type="submit" size="sm" disabled={!formState.isDirty || isPending}>
						Save profile
					</Button>
				</div>
			</form>
		</SectionCard>
	)
}
