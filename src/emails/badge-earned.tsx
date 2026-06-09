import { Link, Text } from "@react-email/components"

import { EmailLayout, s } from "./layout"

const BADGE_LABELS: Record<string, string> = {
	STREAK_7: "7-Day Streak",
	STREAK_30: "30-Day Streak",
	STREAK_100: "100-Day Streak",
	STREAK_365: "365-Day Streak",
	SOLVED_1: "First Solve",
	SOLVED_10: "10 Problems",
	SOLVED_50: "50 Problems",
	SOLVED_100: "100 Problems",
	NC250_COMPLETE: "250 - Roadmap Done",
	NC150_COMPLETE: "150 - Roadmap Done",
	BLIND75_COMPLETE: "75 - Roadmap Done",
	FIRST_SOLVER_1: "First Solver ×1",
	FIRST_SOLVER_10: "First Solver ×10",
	FIRST_SOLVER_50: "First Solver ×50",
	CONSISTENT_30: "Consistent 30",
}

const BADGE_COPY: Record<string, string> = {
	STREAK_7: "The habit is forming - don't let tomorrow break it.",
	STREAK_30: "Most people quit before now. You haven't.",
	STREAK_100: "That's not a habit anymore - it's who you are.",
	STREAK_365: "You showed up every single day for a full year. That's extraordinary.",
	SOLVED_1: "Day one in the books. Come back tomorrow.",
	SOLVED_10: "Ten problems down. You're building something real.",
	SOLVED_50: "Fifty problems. You've outpaced most people who ever started.",
	SOLVED_100: "A hundred. That's not luck - it's commitment.",
	NC250_COMPLETE: "You finished the whole roadmap. That's not nothing.",
	NC150_COMPLETE: "150 problems, done. Solid foundation built.",
	BLIND75_COMPLETE: "The classic list, finished. You're ready for what comes next.",
	FIRST_SOLVER_1: "Someone had to be first. It was you.",
	FIRST_SOLVER_10: "You're consistently the one who shows up early.",
	FIRST_SOLVER_50: "50 times you beat the group to the solve. That's a pattern.",
	CONSISTENT_30: "30 days consistent. That separates the serious from the casual.",
}

interface BadgeEarnedEmailProps {
	name: string
	badgeType: string
	dashboardUrl: string
}

export default function BadgeEarnedEmail({
	name,
	badgeType,
	dashboardUrl,
}: BadgeEarnedEmailProps) {
	const label = BADGE_LABELS[badgeType] ?? badgeType
	const copy = BADGE_COPY[badgeType] ?? "Keep showing up."

	return (
		<EmailLayout
			preview={`New badge: ${label} - keep going`}
			note="You're receiving this because you earned a badge on PStrack."
		>
			<Text style={s.heading}>New badge: {label}</Text>
			<Text style={s.para}>
				Hey {name} - {copy}
			</Text>
			<Text style={s.para}>
				<Link href={dashboardUrl} style={s.link}>
					View your profile →
				</Link>
			</Text>
		</EmailLayout>
	)
}
