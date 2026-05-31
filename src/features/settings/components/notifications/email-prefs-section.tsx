import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { MeResponse } from "@/server/users/users.type"
import {
	type NotificationsFormInput,
	notificationsFormSchema,
} from "@/server/users/users.type"
import { useUpdateNotifications } from "../../hooks/use-me"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

const PREFS = [
	{
		key: "notifyDailyProblem" as const,
		title: "Daily problem digest",
		description: "Today's problem, your solve confirmation, and verification failures.",
	},
	{
		key: "notifyAchievements" as const,
		title: "Achievements",
		description: "Streak milestones and badges you earn.",
	},
	{
		key: "notifyGroupActivity" as const,
		title: "Group activity",
		description: "Join requests, approvals, and group membership changes.",
	},
]

export const EmailPrefsSection = ({ me }: { me: MeResponse }) => {
	const update = useUpdateNotifications()
	const form = useForm<NotificationsFormInput>({
		resolver: zodResolver(notificationsFormSchema),
		values: {
			notifyDailyProblem: me.notifyDailyProblem,
			notifyAchievements: me.notifyAchievements,
			notifyGroupActivity: me.notifyGroupActivity,
		},
	})
	const { handleSubmit, control, formState } = form

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(update.mutateAsync(values), {
			loading: { title: "Saving preferences..." },
			success: { title: "Preferences saved" },
			error: (err) => ({
				title: "Couldn't save preferences",
				description: errorDescription(err),
			}),
		})
	})

	return (
		<SectionCard
			title="Email notifications"
			description="Choose which emails PSTrack sends you. Security and account emails always send."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-4">
				<div className="flex flex-col gap-2">
					{PREFS.map((pref) => (
						<Controller
							key={pref.key}
							control={control}
							name={pref.key}
							render={({ field }) => (
								<div className="flex items-start gap-3 rounded-md border border-border p-3">
									<Checkbox
										id={pref.key}
										checked={field.value}
										onCheckedChange={(v) => field.onChange(v === true)}
										disabled={update.isPending}
										className="mt-0.5"
									/>
									<div className="flex flex-col gap-0.5">
										<Label htmlFor={pref.key} className="font-medium">
											{pref.title}
										</Label>
										<p className="text-muted-foreground text-xs">{pref.description}</p>
									</div>
								</div>
							)}
						/>
					))}
				</div>
				<div>
					<Button
						type="submit"
						size="sm"
						disabled={!formState.isDirty || update.isPending}
					>
						Save preferences
					</Button>
				</div>
			</form>
		</SectionCard>
	)
}
