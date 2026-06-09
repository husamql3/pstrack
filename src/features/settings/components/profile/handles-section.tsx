import { zodResolver } from "@hookform/resolvers/zod"
import { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import { sileo } from "sileo"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusIcon } from "@/features/onboarding/components/status-icon"
import { useCheckCodeforces } from "@/features/onboarding/hooks/use-check-codeforces"
import { useCheckLeetcode } from "@/features/onboarding/hooks/use-check-leetcode"
import type { FieldStatus } from "@/features/onboarding/types"
import type { MeResponse } from "@/server/users/users.type"
import { type HandlesFormInput, handlesFormSchema } from "@/server/users/users.type"
import { useUpdateHandles } from "../../hooks/use-me"
import { errorDescription } from "../../utils"
import { SectionCard } from "../section-card"

const toDefaults = (me: MeResponse): HandlesFormInput => ({
	leetcodeHandle: me.leetcodeHandle ?? "",
	codeforcesHandle: me.codeforcesHandle,
})

export const HandlesSection = ({ me }: { me: MeResponse }) => {
	const updateHandles = useUpdateHandles()
	const { mutateAsync: checkLeetcode } = useCheckLeetcode()
	const { mutateAsync: checkCodeforces } = useCheckCodeforces()

	const [lcStatus, setLcStatus] = useState<FieldStatus>("idle")
	const [cfStatus, setCfStatus] = useState<FieldStatus>("idle")

	const form = useForm<HandlesFormInput>({
		resolver: zodResolver(handlesFormSchema),
		values: toDefaults(me),
	})
	const { register, handleSubmit, watch, formState } = form
	const lc = watch("leetcodeHandle")
	const cf = watch("codeforcesHandle")
	const isPending = updateHandles.isPending

	const verifyLeetcode = useCallback(async () => {
		const value = (lc ?? "").trim()
		if (!value) {
			setLcStatus("idle")
			return
		}
		if (value === me.leetcodeHandle) {
			setLcStatus("idle")
			return
		}
		setLcStatus("checking")
		try {
			const exists = await checkLeetcode(value)
			setLcStatus(exists ? "valid" : "invalid")
		} catch {
			setLcStatus("invalid")
		}
	}, [lc, me.leetcodeHandle, checkLeetcode])

	const verifyCodeforces = useCallback(async () => {
		const value = (cf ?? "").trim()
		if (!value) {
			setCfStatus("idle")
			return
		}
		if (value === me.codeforcesHandle) {
			setCfStatus("idle")
			return
		}
		setCfStatus("checking")
		try {
			const exists = await checkCodeforces(value)
			setCfStatus(exists ? "valid" : "invalid")
		} catch {
			setCfStatus("invalid")
		}
	}, [cf, me.codeforcesHandle, checkCodeforces])

	const onSubmit = handleSubmit(async (values) => {
		await sileo.promise(updateHandles.mutateAsync(values), {
			loading: { title: "Saving handles..." },
			success: { title: "Handles saved" },
			error: (err) => ({
				title: "Couldn't save handles",
				description: errorDescription(err),
			}),
		})
	})

	const blockSubmit =
		!formState.isDirty ||
		isPending ||
		lcStatus === "checking" ||
		lcStatus === "invalid" ||
		cfStatus === "checking" ||
		cfStatus === "invalid"

	return (
		<SectionCard
			title="Competitive coding handles"
			description="We poll these to verify your daily solves. Changing them won't affect past points."
		>
			<form onSubmit={onSubmit} className="flex flex-col gap-5">
				<div className="grid gap-1.5">
					<Label htmlFor="leetcodeHandle">LeetCode handle</Label>
					<div className="relative max-w-md">
						<Input
							id="leetcodeHandle"
							{...register("leetcodeHandle")}
							onBlur={verifyLeetcode}
							disabled={isPending}
							autoComplete="off"
							className="pr-8"
						/>
						<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
							<StatusIcon status={lcStatus} />
						</span>
					</div>
					{lcStatus === "invalid" && (
						<p className="text-destructive text-xs">LeetCode account not found</p>
					)}
				</div>

				<div className="grid gap-1.5">
					<Label htmlFor="codeforcesHandle">
						Codeforces handle{" "}
						<span className="font-normal text-muted-foreground">(optional)</span>
					</Label>
					<div className="relative max-w-md">
						<Input
							id="codeforcesHandle"
							{...register("codeforcesHandle")}
							onBlur={verifyCodeforces}
							disabled={isPending}
							autoComplete="off"
							className="pr-8"
						/>
						<span className="absolute top-1/2 right-2.5 -translate-y-1/2">
							<StatusIcon status={cfStatus} />
						</span>
					</div>
					{cfStatus === "invalid" && (
						<p className="text-destructive text-xs">Codeforces account not found</p>
					)}
				</div>

				<div>
					<Button type="submit" size="sm" disabled={blockSubmit}>
						Save handles
					</Button>
				</div>
			</form>
		</SectionCard>
	)
}
