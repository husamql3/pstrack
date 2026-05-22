import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/onboarding")({
	component: OnboardingPage,
})

function OnboardingPage() {
	return <div>Onboarding</div>
}
