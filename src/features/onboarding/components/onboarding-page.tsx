import { useCallback, useState } from "react"

import { useSession } from "@/lib/auth-client"

import type { ProfileState, Step } from "../types"
import { deriveInitialUsername } from "../utils"
import { GroupStep } from "./group-step"
import { OnboardingHeader } from "./onboarding-header"
import { ProfileStep } from "./profile-step"
import { WelcomeStep } from "./welcome-step"

export const OnboardingPage = () => {
	const { data: session } = useSession()
	const user = session?.user

	const [step, setStep] = useState<Step>(0)
	const [profile, setProfile] = useState<ProfileState>({
		username: deriveInitialUsername(user?.name, user?.email),
		usernameStatus: "idle",
		usernameError: "",
		leetcodeHandle: "",
		leetcodeStatus: "idle",
		codeforcesHandle: "",
		codeforcesStatus: "idle",
	})

	const handleProfileChange = useCallback((patch: Partial<ProfileState>) => {
		setProfile((prev) => ({ ...prev, ...patch }))
	}, [])

	return (
		<div className="flex min-h-screen flex-col">
			<OnboardingHeader step={step} />
			{step === 0 && <WelcomeStep onContinue={() => setStep(1)} />}
			{step === 1 && (
				<ProfileStep
					profile={profile}
					onChange={handleProfileChange}
					onContinue={() => setStep(2)}
					onBack={() => setStep(0)}
				/>
			)}
			{step === 2 && <GroupStep onBack={() => setStep(1)} />}
		</div>
	)
}
