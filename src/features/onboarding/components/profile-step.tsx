import { useCallback } from "react"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCheckCodeforces } from "../hooks/use-check-codeforces"
import { useCheckLeetcode } from "../hooks/use-check-leetcode"
import { useCheckUsername } from "../hooks/use-check-username"
import { useSaveProfile } from "../hooks/use-save-profile"
import type { ProfileState } from "../types"
import { sanitizeUsername } from "../utils"
import { HashAvatar } from "./hash-avatar"
import { StatusIcon } from "./status-icon"

export const ProfileStep = ({
	profile,
	onChange,
	onContinue,
	onBack,
}: {
	profile: ProfileState
	onChange: (patch: Partial<ProfileState>) => void
	onContinue: () => void
	onBack: () => void
}) => {
	const { mutateAsync: checkUsernameFn } = useCheckUsername()
	const { mutateAsync: checkLeetcodeFn } = useCheckLeetcode()
	const { mutateAsync: checkCfFn } = useCheckCodeforces()
	const saveProfile = useSaveProfile()

	const cfRequired = profile.codeforcesHandle.trim().length > 0
	const canContinue =
		profile.usernameStatus === "valid" &&
		profile.leetcodeStatus === "valid" &&
		(!cfRequired || profile.codeforcesStatus === "valid") &&
		!saveProfile.isPending

	const handleUsernameBlur = useCallback(async () => {
		const value = profile.username.trim()
		if (!value) {
			onChange({ usernameStatus: "invalid", usernameError: "Username is required" })
			return
		}
		if (value.length < 3) {
			onChange({
				usernameStatus: "invalid",
				usernameError: "Must be at least 3 characters",
			})
			return
		}
		onChange({ usernameStatus: "checking", usernameError: "" })
		try {
			const result = await checkUsernameFn(value)
			if (result.available) {
				onChange({ usernameStatus: "valid", usernameError: "" })
				return
			}
			const message =
				result.reason === "reserved"
					? "That username is reserved"
					: result.reason === "invalid"
						? "Only lowercase letters, numbers, _ and -"
						: "Username is already taken"
			onChange({ usernameStatus: "invalid", usernameError: message })
		} catch {
			onChange({ usernameStatus: "invalid", usernameError: "Could not verify username" })
		}
	}, [profile.username, onChange, checkUsernameFn])

	const handleLeetcodeBlur = useCallback(async () => {
		const value = profile.leetcodeHandle.trim()
		if (!value) {
			onChange({ leetcodeStatus: "invalid" })
			return
		}
		onChange({ leetcodeStatus: "checking" })
		try {
			const exists = await checkLeetcodeFn(value)
			onChange({ leetcodeStatus: exists ? "valid" : "invalid" })
		} catch {
			onChange({ leetcodeStatus: "invalid" })
		}
	}, [profile.leetcodeHandle, onChange, checkLeetcodeFn])

	const handleCodeforcesBlur = useCallback(async () => {
		const value = profile.codeforcesHandle.trim()
		if (!value) {
			onChange({ codeforcesStatus: "idle" })
			return
		}
		onChange({ codeforcesStatus: "checking" })
		try {
			const exists = await checkCfFn(value)
			onChange({ codeforcesStatus: exists ? "valid" : "invalid" })
		} catch {
			onChange({ codeforcesStatus: "invalid" })
		}
	}, [profile.codeforcesHandle, onChange, checkCfFn])

	const handleContinue = async () => {
		if (!canContinue) return
		try {
			await sileo.promise(
				saveProfile.mutateAsync({
					username: profile.username,
					leetcodeHandle: profile.leetcodeHandle,
					codeforcesHandle: profile.codeforcesHandle || undefined,
				}),
				{
					loading: { title: "Saving profile..." },
					success: { title: "Profile saved!" },
					error: (err: unknown) => ({
						title: "Failed to save profile",
						description: err instanceof Error ? err.message : "Please try again.",
					}),
				}
			)
			onContinue()
		} catch {
			// sileo.promise already showed the error toast
		}
	}

	return (
		<main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
			<div className="flex w-full max-w-sm flex-col gap-8">
				<div className="text-center">
					<h2 className="font-bold text-2xl tracking-tight">Set up your profile</h2>
					<p className="mt-1 text-muted-foreground text-sm">
						This is how other members will see you.
					</p>
				</div>

				<div className="flex flex-col items-center gap-2">
					<HashAvatar username={profile.username} size={80} />
					<p className="text-muted-foreground text-xs">
						Unique avatar - auto-generated from your username
					</p>
				</div>

				<div className="flex flex-col gap-5">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="username">Username</Label>
						<div className="relative">
							<Input
								id="username"
								value={profile.username}
								autoComplete="off"
								onChange={(e) =>
									onChange({
										username: sanitizeUsername(e.target.value),
										usernameStatus: "idle",
										usernameError: "",
									})
								}
								onBlur={handleUsernameBlur}
								placeholder="yourhandle"
								className="pr-8"
							/>
							<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
								<StatusIcon status={profile.usernameStatus} />
							</span>
						</div>
						{profile.usernameError && (
							<p className="text-destructive text-xs">{profile.usernameError}</p>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="leetcode">LeetCode handle</Label>
						<div className="relative">
							<Input
								id="leetcode"
								value={profile.leetcodeHandle}
								autoComplete="off"
								onChange={(e) =>
									onChange({ leetcodeHandle: e.target.value, leetcodeStatus: "idle" })
								}
								onBlur={handleLeetcodeBlur}
								placeholder="your-lc-username"
								className="pr-8"
							/>
							<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
								<StatusIcon status={profile.leetcodeStatus} />
							</span>
						</div>
						{profile.leetcodeStatus === "invalid" && (
							<p className="text-destructive text-xs">LeetCode account not found</p>
						)}
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="codeforces">
							Codeforces handle{" "}
							<span className="font-normal text-muted-foreground">(optional)</span>
						</Label>
						<div className="relative">
							<Input
								id="codeforces"
								value={profile.codeforcesHandle}
								autoComplete="off"
								onChange={(e) =>
									onChange({ codeforcesHandle: e.target.value, codeforcesStatus: "idle" })
								}
								onBlur={handleCodeforcesBlur}
								placeholder="your-cf-handle"
								className="pr-8"
							/>
							<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
								<StatusIcon status={profile.codeforcesStatus} />
							</span>
						</div>
						{profile.codeforcesStatus === "invalid" && (
							<p className="text-destructive text-xs">Codeforces account not found</p>
						)}
					</div>
				</div>

				<div className="flex gap-3">
					<Button variant="outline" onClick={onBack} className="flex-1">
						Back
					</Button>
					<Button onClick={handleContinue} disabled={!canContinue} className="flex-1">
						{saveProfile.isPending ? (
							<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						) : (
							"Continue"
						)}
					</Button>
				</div>
			</div>
		</main>
	)
}
