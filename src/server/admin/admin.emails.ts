import type { ReactElement } from "react"

import BadgeEarnedEmail from "@/emails/badge-earned"
import DailyProblemEmail from "@/emails/daily-problem"
import JoinApprovedEmail from "@/emails/join-approved"
import JoinExpiredEmail from "@/emails/join-expired"
import JoinRejectedEmail from "@/emails/join-rejected"
import JoinRequestEmail from "@/emails/join-request"
import MagicLinkEmail from "@/emails/magic-link"
import ProUnlockedByPointsEmail from "@/emails/pro-unlocked-by-points"
import RemovedFromGroupEmail from "@/emails/removed-from-group"
import StreakMilestoneEmail from "@/emails/streak-milestone"
import WelcomeEmail from "@/emails/welcome"

type TemplateRender = (props: Record<string, unknown>) => ReactElement

type TemplateMeta = {
	key: string
	label: string
	subject: (props: Record<string, unknown>) => string
	render: TemplateRender
	exampleProps: Record<string, unknown>
}

const cast = <P>(props: Record<string, unknown>): P => props as P

export const EMAIL_TEMPLATES: TemplateMeta[] = [
	{
		key: "welcome",
		label: "Welcome",
		subject: () => "Welcome to PStrack",
		render: (props) => WelcomeEmail(cast(props)),
		exampleProps: { name: "Alex" },
	},
	{
		key: "magic-link",
		label: "Magic link",
		subject: () => "Your PStrack sign-in link",
		render: (props) => MagicLinkEmail(cast(props)),
		exampleProps: { url: "https://pstrack.app/api/v3/magic-link?token=test" },
	},
	{
		key: "daily-problem",
		label: "Daily problem digest",
		subject: (props) => `Today's problem: ${String(props.problemTitle ?? "Two Sum")}`,
		render: (props) => DailyProblemEmail(cast(props)),
		exampleProps: {
			name: "Alex",
			groupName: "@your-group",
			problemTitle: "Two Sum",
			difficulty: "EASY",
			topic: "Arrays & Hashing",
			problemUrl: "https://leetcode.com/problems/two-sum/",
			dashboardUrl: "https://pstrack.app/dashboard",
		},
	},
	{
		key: "streak-milestone",
		label: "Streak milestone",
		subject: (props) => `${String(props.streakLength ?? 7)}-day streak unlocked!`,
		render: (props) => StreakMilestoneEmail(cast(props)),
		exampleProps: {
			name: "Alex",
			streakLength: 7,
			dashboardUrl: "https://pstrack.app/dashboard",
		},
	},
	{
		key: "badge-earned",
		label: "Badge earned",
		subject: () => "New badge earned",
		render: (props) => BadgeEarnedEmail(cast(props)),
		exampleProps: {
			name: "Alex",
			badgeType: "STREAK_7",
			dashboardUrl: "https://pstrack.app/dashboard",
		},
	},
	{
		key: "pro-unlocked-by-points",
		label: "Pro unlocked (points)",
		subject: () => "You unlocked PStrack Pro",
		render: (props) => ProUnlockedByPointsEmail(cast(props)),
		exampleProps: { name: "Alex", dashboardUrl: "https://pstrack.app/dashboard" },
	},
	{
		key: "join-request",
		label: "Group join request (to admin)",
		subject: () => "New join request",
		render: (props) => JoinRequestEmail(cast(props)),
		exampleProps: {
			adminName: "Admin",
			applicantName: "Alex",
			groupName: "@your-group",
			manageUrl: "https://pstrack.app/groups/your-group/join-requests",
		},
	},
	{
		key: "join-approved",
		label: "Group join approved",
		subject: () => "You're in!",
		render: (props) => JoinApprovedEmail(cast(props)),
		exampleProps: {
			name: "Alex",
			groupName: "@your-group",
			groupUrl: "https://pstrack.app/groups/your-group",
		},
	},
	{
		key: "join-rejected",
		label: "Group join rejected",
		subject: () => "Update on your group request",
		render: (props) => JoinRejectedEmail(cast(props)),
		exampleProps: { name: "Alex", groupName: "@your-group" },
	},
	{
		key: "join-expired",
		label: "Group join request expired",
		subject: () => "Your group request expired",
		render: (props) => JoinExpiredEmail(cast(props)),
		exampleProps: { name: "Alex", groupName: "@your-group" },
	},
	{
		key: "removed-from-group",
		label: "Removed from group",
		subject: () => "You were removed from a group",
		render: (props) => RemovedFromGroupEmail(cast(props)),
		exampleProps: { name: "Alex", groupName: "@your-group" },
	},
]

export const EMAIL_TEMPLATE_MAP = new Map(EMAIL_TEMPLATES.map((t) => [t.key, t]))

export type EmailTemplateMeta = TemplateMeta
