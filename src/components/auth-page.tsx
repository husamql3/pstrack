import { zodResolver } from "@hookform/resolvers/zod"
import { IconAt } from "@tabler/icons-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"
import { z } from "zod"

import { AuthDivider } from "@/components/auth-divider"
import { GithubIcon } from "@/components/icons/github-icon"
import { GoogleIcon } from "@/components/icons/google-icon"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

const emailSchema = z.object({
	email: z.email("Enter a valid email address"),
})

type EmailForm = z.infer<typeof emailSchema>

export function AuthPage({ redirect }: { redirect?: string }) {
	const [sent, setSent] = useState(false)
	const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null)
	const callbackURL = redirect ?? "/dashboard"

	const form = useForm<EmailForm>({
		resolver: zodResolver(emailSchema),
		defaultValues: { email: "" },
	})

	async function onSubmit({ email }: EmailForm) {
		try {
			await sileo.promise(
				(async () => {
					const result = await authClient.signIn.magicLink({
						email,
						callbackURL,
					})
					if (result.error) throw new Error(result.error.message)
					return result.data
				})(),
				{
					loading: { title: "Sending link…" },
					success: {
						title: "Magic link sent!",
						description: "Check your inbox",
					},
					error: (err) => ({
						title: err instanceof Error ? err.message : "Failed to send magic link",
						type: "error" as const,
					}),
				}
			)
			setSent(true)
		} catch {
			// sileo already displayed the error toast
		}
	}

	async function handleOAuth(provider: "google" | "github") {
		setOauthLoading(provider)
		const { error } = await authClient.signIn.social({ provider, callbackURL })
		if (error) {
			sileo.error({
				title: error.message ?? `Failed to sign in with ${provider}`,
			})
			setOauthLoading(null)
		}
	}

	const isSubmitting = form.formState.isSubmitting
	const isBusy = isSubmitting || oauthLoading !== null

	return (
		<div className="relative w-full overflow-hidden md:h-screen">
			<div
				className={cn(
					"relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-between p-6 md:p-8"
				)}
			>
				<div className="flex justify-center">
					<img
						src="/logo-dark.png"
						alt="pstrack"
						className="h-5 select-none hidden dark:block"
					/>
					<img
						src="/logo-light.png"
						alt="pstrack"
						className="h-5 select-none dark:hidden"
					/>
				</div>

				<div className="fade-in slide-in-from-bottom-4 w-full animate-in space-y-4 duration-500">
					<div className="flex flex-col space-y-1">
						<h1 className="font-bold text-2xl tracking-wide">Join Now!</h1>
						<p className="text-base text-muted-foreground">
							Login or create your account.
						</p>
					</div>

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
						<InputGroup>
							<InputGroupInput
								{...form.register("email")}
								placeholder="your.email@example.com"
								type="email"
								autoComplete="off"
								disabled={isBusy}
							/>
							<InputGroupAddon align="inline-start">
								<IconAt />
							</InputGroupAddon>
						</InputGroup>
						{form.formState.errors.email && (
							<p className="text-destructive text-sm">
								{form.formState.errors.email.message}
							</p>
						)}
						<Button className="w-full" type="submit" disabled={isBusy}>
							{isSubmitting ? "Sending…" : "Continue With Email"}
						</Button>
						{sent && (
							<p className="text-center text-primary-foreground text-sm">
								Check your inbox for a magic link.
							</p>
						)}
					</form>

					<AuthDivider>OR CONTINUE WITH</AuthDivider>

					<div className="space-y-2">
						<Button
							className="w-full"
							type="button"
							variant="outline"
							disabled={isBusy}
							onClick={() => handleOAuth("google")}
						>
							<GoogleIcon data-icon="inline-start" />
							{oauthLoading === "google" ? "Redirecting…" : "Google"}
						</Button>
						<Button
							className="w-full"
							type="button"
							variant="outline"
							disabled={isBusy}
							onClick={() => handleOAuth("github")}
						>
							<GithubIcon data-icon="inline-start" />
							{oauthLoading === "github" ? "Redirecting…" : "GitHub"}
						</Button>
					</div>
				</div>

				<p className="text-center text-muted-foreground text-sm">
					Show up. Solve. Repeat.
				</p>
			</div>
		</div>
	)
}
