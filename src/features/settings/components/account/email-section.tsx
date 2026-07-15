import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ME_QUERY_KEY } from "@/features/settings/hooks/use-me"
import { authClient } from "@/lib/auth-client"
import type { MeResponse } from "@/server/users/users.type"
import {
	type ChangeEmailConfirmInput,
	type ChangeEmailRequestInput,
	changeEmailConfirmSchema,
	changeEmailRequestSchema,
} from "@/server/users/users.type"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

type Step = "idle" | "request" | "confirm"

const otpInputProps = {
	inputMode: "numeric" as const,
	autoComplete: "one-time-code",
	maxLength: 6,
	placeholder: "000000",
	className: "max-w-[12rem] tracking-[0.4em]",
}

export const EmailSection = ({ me }: { me: MeResponse }) => {
	const queryClient = useQueryClient()
	const [step, setStep] = useState<Step>("idle")
	const [pendingEmail, setPendingEmail] = useState("")

	const requestForm = useForm<ChangeEmailRequestInput>({
		resolver: zodResolver(changeEmailRequestSchema),
		defaultValues: { newEmail: "", currentOtp: "" },
	})
	const confirmForm = useForm<ChangeEmailConfirmInput>({
		resolver: zodResolver(changeEmailConfirmSchema),
		defaultValues: { newOtp: "" },
	})

	// Fire a fresh code to the CURRENT inbox — required before requestEmailChange
	// because the plugin runs with verifyCurrentEmail: true.
	const sendCurrentCode = () =>
		sileo.promise(
			(async () => {
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email: me.email,
					type: "email-verification",
				})
				if (error) throw new Error(error.message ?? "Couldn't send the code")
			})(),
			{
				loading: { title: "Sending code..." },
				success: {
					title: "Code sent",
					description: `Check ${me.email} for a 6-digit code.`,
				},
				error: (err) => ({
					title: "Couldn't send the code",
					description: errorDescription(err),
				}),
			}
		)

	const startChange = async () => {
		await sendCurrentCode()
		setStep("request")
	}

	const cancel = () => {
		requestForm.reset()
		confirmForm.reset()
		setPendingEmail("")
		setStep("idle")
	}

	// Step 1 → verify the current inbox, then send a code to the new inbox.
	const onRequest = requestForm.handleSubmit(async ({ newEmail, currentOtp }) => {
		if (newEmail === me.email) {
			requestForm.setError("newEmail", {
				message: "That's already your email address.",
			})
			return
		}
		await sileo
			.promise(
				(async () => {
					const { error } = await authClient.emailOtp.requestEmailChange({
						newEmail,
						otp: currentOtp,
					})
					if (error) throw new Error(error.message ?? "Couldn't verify the code")
				})(),
				{
					loading: { title: "Verifying..." },
					success: {
						title: "Code sent to your new email",
						description: `Enter the code we sent to ${newEmail}.`,
					},
					error: (err) => ({
						title: "Couldn't verify the code",
						description: errorDescription(err),
					}),
				}
			)
			.then(() => {
				setPendingEmail(newEmail)
				confirmForm.reset()
				setStep("confirm")
			})
			.catch(() => {})
	})

	// Step 2 → verify the new inbox; on success the address is swapped + verified.
	const onConfirm = confirmForm.handleSubmit(async ({ newOtp }) => {
		await sileo
			.promise(
				(async () => {
					const { error } = await authClient.emailOtp.changeEmail({
						newEmail: pendingEmail,
						otp: newOtp,
					})
					if (error) throw new Error(error.message ?? "Couldn't change email")
				})(),
				{
					loading: { title: "Updating email..." },
					success: {
						title: "Email updated",
						description: `Your email is now ${pendingEmail}.`,
					},
					error: (err) => ({
						title: "Couldn't change email",
						description: errorDescription(err),
					}),
				}
			)
			.then(async () => {
				await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
				cancel()
			})
			.catch(() => {})
	})

	// Resend the new-inbox code — verifyCurrentEmail consumed the current-inbox
	// code, so a resend has to restart from step 1 with a fresh one.
	const startOver = async () => {
		confirmForm.reset()
		requestForm.reset({ newEmail: pendingEmail, currentOtp: "" })
		setStep("request")
		await sendCurrentCode()
	}

	return (
		<SectionCard
			title="Email"
			description="Used for sign-in and notifications. Changing it requires a code sent to both your current and new address."
		>
			{step === "idle" && (
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="truncate font-medium text-sm">{me.email}</p>
						<p className="text-muted-foreground text-xs">
							{me.emailVerified ? "Verified" : "Pending verification"}
						</p>
					</div>
					<Button variant="outline" size="sm" onClick={startChange}>
						Change email
					</Button>
				</div>
			)}

			{step === "request" && (
				<form onSubmit={onRequest} className="flex flex-col gap-3">
					<p className="text-muted-foreground text-sm">
						We sent a 6-digit code to <strong>{me.email}</strong>. Enter it and your new
						email address.
					</p>
					<div className="grid gap-1.5">
						<Label htmlFor="currentOtp">Code from your current email</Label>
						<Input
							id="currentOtp"
							{...otpInputProps}
							{...requestForm.register("currentOtp")}
						/>
						{requestForm.formState.errors.currentOtp && (
							<p className="text-destructive text-xs">
								{requestForm.formState.errors.currentOtp.message}
							</p>
						)}
					</div>
					<div className="grid gap-1.5">
						<Label htmlFor="newEmail">New email address</Label>
						<Input
							id="newEmail"
							type="email"
							autoComplete="email"
							className="max-w-md"
							{...requestForm.register("newEmail")}
						/>
						{requestForm.formState.errors.newEmail && (
							<p className="text-destructive text-xs">
								{requestForm.formState.errors.newEmail.message}
							</p>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button type="submit" size="sm" disabled={requestForm.formState.isSubmitting}>
							Continue
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={cancel}>
							Cancel
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={sendCurrentCode}
							disabled={requestForm.formState.isSubmitting}
						>
							Resend code
						</Button>
					</div>
				</form>
			)}

			{step === "confirm" && (
				<form onSubmit={onConfirm} className="flex flex-col gap-3">
					<p className="text-muted-foreground text-sm">
						We sent a 6-digit code to <strong>{pendingEmail}</strong>. Enter it to confirm
						the change.
					</p>
					<div className="grid gap-1.5">
						<Label htmlFor="newOtp">Code from your new email</Label>
						<Input id="newOtp" {...otpInputProps} {...confirmForm.register("newOtp")} />
						{confirmForm.formState.errors.newOtp && (
							<p className="text-destructive text-xs">
								{confirmForm.formState.errors.newOtp.message}
							</p>
						)}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button type="submit" size="sm" disabled={confirmForm.formState.isSubmitting}>
							Confirm change
						</Button>
						<Button type="button" variant="outline" size="sm" onClick={cancel}>
							Cancel
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={startOver}
							disabled={confirmForm.formState.isSubmitting}
						>
							Start over
						</Button>
					</div>
				</form>
			)}
		</SectionCard>
	)
}
