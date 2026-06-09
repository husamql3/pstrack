import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCheckUsername } from "@/features/onboarding/hooks/use-check-username"
import { sanitizeUsername } from "@/features/onboarding/utils"
import type { MeResponse } from "@/server/users/users.type"
import { type UsernameFormInput, usernameFormSchema } from "@/server/users/users.type"
import { useUpdateUsername } from "../../hooks/use-me"
import { errorDescription, formatDate } from "../../utils"
import { SectionCard } from "../section-card"

export const UsernameSection = ({ me }: { me: MeResponse }) => {
	const updateUsername = useUpdateUsername()
	const { mutateAsync: checkUsername } = useCheckUsername()

	const nextChangeAt = me.usernameNextChangeAt ? new Date(me.usernameNextChangeAt) : null
	const locked = !!nextChangeAt

	const form = useForm<UsernameFormInput>({
		resolver: zodResolver(usernameFormSchema),
		values: { username: me.username ?? "" },
	})

	const { register, handleSubmit, formState, setError, setValue, watch } = form
	const username = watch("username")
	const isDirty = (username ?? "") !== (me.username ?? "")

	const onBlur = useCallback(async () => {
		const value = (username ?? "").trim()
		if (!value || value === me.username) return
		try {
			const result = await checkUsername(value)
			if (!result.available) {
				setError("username", {
					message:
						result.reason === "reserved"
							? "That username is reserved"
							: result.reason === "invalid"
								? "Only lowercase letters, numbers, _ and -"
								: "Username is already taken",
				})
			}
		} catch {
			setError("username", { message: "Could not verify username" })
		}
	}, [username, me.username, checkUsername, setError])

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(updateUsername.mutateAsync(values.username), {
			loading: { title: "Saving username..." },
			success: { title: "Username updated" },
			error: (err) => ({
				title: "Couldn't update username",
				description: errorDescription(err),
			}),
		})
	})

	return (
		<SectionCard
			title="Username"
			description="Your unique handle and the URL of your public profile. You can change it once every 30 days."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="username">Username</Label>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">pstrack.app/</span>
						<Input
							id="username"
							{...register("username")}
							onChange={(e) =>
								setValue("username", sanitizeUsername(e.target.value), {
									shouldDirty: true,
								})
							}
							onBlur={onBlur}
							disabled={locked || updateUsername.isPending}
							autoComplete="off"
							className="max-w-xs"
						/>
					</div>
					{formState.errors.username && (
						<p className="text-destructive text-xs">
							{formState.errors.username.message}
						</p>
					)}
					{locked && nextChangeAt && (
						<p className="text-muted-foreground text-xs">
							You can change your username again on {formatDate(nextChangeAt)}.
						</p>
					)}
				</div>
				<div>
					<Button
						type="submit"
						size="sm"
						disabled={!isDirty || locked || updateUsername.isPending}
					>
						Save username
					</Button>
				</div>
			</form>
		</SectionCard>
	)
}
