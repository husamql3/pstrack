import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import type { MeResponse } from "@/server/users/users.type"
import { type EmailFormInput, emailFormSchema } from "@/server/users/users.type"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

export const EmailSection = ({ me }: { me: MeResponse }) => {
	const [editing, setEditing] = useState(false)
	const form = useForm<EmailFormInput>({
		resolver: zodResolver(emailFormSchema),
		values: { email: me.email },
	})
	const { register, handleSubmit, formState, reset } = form

	const onSubmit = handleSubmit(async ({ email }) => {
		if (email === me.email) {
			setEditing(false)
			return
		}
		await sileo.promise(
			(async () => {
				const { error } = await authClient.changeEmail({
					newEmail: email,
					callbackURL: "/settings/account",
				})
				if (error) throw new Error(error.message ?? "Couldn't change email")
			})(),
			{
				loading: { title: "Sending verification..." },
				success: {
					title: "Verification sent",
					description: `Check ${email} to confirm the change.`,
				},
				error: (err) => ({
					title: "Couldn't change email",
					description: errorDescription(err),
				}),
			}
		)
		setEditing(false)
	})

	return (
		<SectionCard
			title="Email"
			description="Used for sign-in and notifications. Changing it requires re-verification."
		>
			{!editing ? (
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">{me.email}</p>
						<p className="text-muted-foreground text-xs">
							{me.emailVerified ? "Verified" : "Pending verification"}
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={() => setEditing(true)}>
						Change email
					</Button>
				</div>
			) : (
				<form onSubmit={onSubmit} className="flex flex-col gap-3">
					<div className="grid gap-1.5">
						<Label htmlFor="email">New email address</Label>
						<Input
							id="email"
							type="email"
							autoComplete="email"
							{...register("email")}
							className="max-w-md"
						/>
						{formState.errors.email && (
							<p className="text-destructive text-xs">{formState.errors.email.message}</p>
						)}
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => {
								reset({ email: me.email })
								setEditing(false)
							}}
						>
							Cancel
						</Button>
						<Button type="submit" size="sm" disabled={formState.isSubmitting}>
							Send verification
						</Button>
					</div>
				</form>
			)}
		</SectionCard>
	)
}
