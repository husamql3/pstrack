import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MeResponse } from "@/server/users/users.type"
import { useUpdateProfile } from "../../hooks/use-me"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

const optionalNullableString = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((s) => (s.length === 0 ? null : s))
		.nullable()

const schema = z.object({
	twitterHandle: optionalNullableString(40),
	linkedinHandle: optionalNullableString(80),
	websiteUrl: optionalNullableString(200),
})

type FormInput = z.infer<typeof schema>

export const SocialsSection = ({ me }: { me: MeResponse }) => {
	const updateProfile = useUpdateProfile()
	const form = useForm<FormInput>({
		resolver: zodResolver(schema),
		values: {
			twitterHandle: me.twitterHandle,
			linkedinHandle: me.linkedinHandle,
			websiteUrl: me.websiteUrl,
		},
	})
	const { register, handleSubmit, formState } = form
	const isPending = updateProfile.isPending

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(updateProfile.mutateAsync(values), {
			loading: { title: "Saving links..." },
			success: { title: "Links saved" },
			error: (err) => ({
				title: "Couldn't save links",
				description: errorDescription(err),
			}),
		})
	})

	return (
		<SectionCard
			title="Links"
			description="Shown on your public profile alongside your stats."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<div className="grid gap-1.5">
					<Label htmlFor="twitterHandle">Twitter / X handle</Label>
					<div className="flex max-w-md items-center gap-2">
						<span className="text-muted-foreground text-sm">@</span>
						<Input
							id="twitterHandle"
							{...register("twitterHandle")}
							disabled={isPending}
							autoComplete="off"
							placeholder="yourhandle"
						/>
					</div>
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="linkedinHandle">LinkedIn username</Label>
					<div className="flex max-w-md items-center gap-2">
						<span className="text-muted-foreground text-sm">linkedin.com/in/</span>
						<Input
							id="linkedinHandle"
							{...register("linkedinHandle")}
							disabled={isPending}
							autoComplete="off"
							placeholder="yourname"
						/>
					</div>
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="websiteUrl">Website</Label>
					<Input
						id="websiteUrl"
						{...register("websiteUrl")}
						disabled={isPending}
						autoComplete="off"
						placeholder="https://yourdomain.com"
						type="url"
						className="max-w-md"
					/>
					{formState.errors.websiteUrl && (
						<p className="text-destructive text-xs">
							{formState.errors.websiteUrl.message}
						</p>
					)}
				</div>

				<div>
					<Button type="submit" size="sm" disabled={!formState.isDirty || isPending}>
						Save links
					</Button>
				</div>
			</form>
		</SectionCard>
	)
}
