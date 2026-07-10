import {
	IconAward,
	IconBolt,
	IconBrandLinkedin,
	IconBrandX,
	IconCode,
	IconFlame,
	IconLink,
} from "@tabler/icons-react"
import { format } from "date-fns"

import { ProBadge } from "@/components/ui/pro-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import { SolveHeatmap } from "@/features/profile/components/solve-heatmap"
import { BadgeType } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import {
	BADGE_CATEGORY,
	BADGE_LABELS,
	type BadgeCategory,
	type EarnedBadge,
} from "@/server/badges/badges.type"
import type { PublicProfileResponse } from "@/server/users/users.type"

const CATEGORY_ICON: Record<BadgeCategory, typeof IconFlame> = {
	streak: IconFlame,
	volume: IconAward,
	social: IconBolt,
}

const RARE_BADGES: Set<BadgeType> = new Set([
	BadgeType.STREAK_365,
	BadgeType.NC250_COMPLETE,
	BadgeType.FIRST_SOLVER_50,
])

const CARD_GRADIENT =
	"dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]"

const Stat = ({
	icon: Icon,
	label,
	href,
}: {
	icon: typeof IconBrandX
	label: string
	href: string
}) => (
	<a
		href={href}
		target="_blank"
		rel="noreferrer"
		className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-accent/40"
	>
		<Icon className="size-4 text-muted-foreground" aria-hidden="true" />
		<span className="truncate">{label}</span>
	</a>
)

const BadgeMedal = ({
	type,
	earnedAt,
	isPro,
}: {
	type: BadgeType
	earnedAt: Date | string
	isPro: boolean
}) => {
	const category = BADGE_CATEGORY[type]
	const Icon = CATEGORY_ICON[category]
	const isRare = RARE_BADGES.has(type)

	return (
		<div
			className={cn(
				"relative flex flex-col items-center gap-3.5 rounded-xl border p-5",
				isPro ? "border-warning/25" : "border-border",
				CARD_GRADIENT
			)}
		>
			{isRare && (
				<span
					className={cn(
						"absolute top-2.5 right-2.5 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.18em]",
						isPro ? "text-warning/80" : "text-muted-foreground"
					)}
				>
					<span aria-hidden="true">◆</span>
					Rare
				</span>
			)}

			<Icon className="size-7" aria-hidden="true" />

			<div className="flex w-full flex-col items-center gap-1 text-center">
				<span className="font-medium text-sm leading-tight">{BADGE_LABELS[type]}</span>
				<span className="font-mono text-[11px] text-muted-foreground tabular-nums">
					{format(new Date(earnedAt), "MMM d, yyyy")}
				</span>
			</div>
		</div>
	)
}

const sortBadges = (badges: EarnedBadge[]): EarnedBadge[] =>
	[...badges].sort((a, b) => {
		const aRare = RARE_BADGES.has(a.type) ? 0 : 1
		const bRare = RARE_BADGES.has(b.type) ? 0 : 1
		if (aRare !== bRare) return aRare - bRare
		return new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
	})

const AchievementsSection = ({
	badges,
	isPro,
}: {
	badges: EarnedBadge[]
	isPro: boolean
}) => {
	if (badges.length === 0) return null

	const sorted = sortBadges(badges)
	const rarest = sorted.find((b) => RARE_BADGES.has(b.type))

	return (
		<section className="flex flex-col gap-6 border-border border-t pt-8">
			<div className="flex flex-col gap-2">
				<span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.24em]">
					Achievements
				</span>
				<div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
					<h2 className="font-semibold text-xl tracking-tight">{badges.length} earned</h2>
					{rarest && (
						<p className="text-muted-foreground text-sm">
							Rarest{" "}
							<span className="mx-1 text-muted-foreground/50" aria-hidden="true">
								·
							</span>
							<span className="text-foreground">{BADGE_LABELS[rarest.type]}</span>
						</p>
					)}
				</div>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{sorted.map((badge) => (
					<BadgeMedal
						key={badge.type}
						type={badge.type}
						earnedAt={badge.earnedAt}
						isPro={isPro}
					/>
				))}
			</div>
		</section>
	)
}

export const PublicProfileSkeleton = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
		<div className="flex items-center gap-4">
			<Skeleton className="size-24 rounded-full" />
			<div className="flex flex-1 flex-col gap-2">
				<Skeleton className="h-7 w-48" />
				<Skeleton className="h-4 w-28" />
				<Skeleton className="mt-2 h-4 w-64" />
			</div>
		</div>
		<div className="grid gap-2 sm:grid-cols-2">
			<Skeleton className="h-10 w-full" />
			<Skeleton className="h-10 w-full" />
		</div>
		<div className="flex flex-col gap-6 border-border border-t pt-8">
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3 w-28" />
				<Skeleton className="h-6 w-40" />
			</div>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
					<Skeleton key={i} className="h-32 rounded-xl" />
				))}
			</div>
		</div>
	</main>
)

export const PublicProfileNotFound = ({ username }: { username: string }) => (
	<main className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
		<h1 className="font-semibold text-xl">User not found</h1>
		<p className="text-muted-foreground text-sm">
			No PStrack user with the username <span className="font-mono">{username}</span>.
		</p>
	</main>
)

export const PublicProfile = ({ profile }: { profile: PublicProfileResponse }) => {
	if (profile.visibility === "PRIVATE") {
		return (
			<main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
				<HashAvatar username={profile.username} size={80} isPro={profile.isPro} />
				<div className="flex flex-col items-center gap-1">
					<div className="flex items-center gap-2">
						<h1 className="font-semibold text-xl">{profile.name}</h1>
						{profile.isPro && <ProBadge />}
					</div>
					<p className="font-mono text-muted-foreground text-sm">@{profile.username}</p>
				</div>
				<p className="mt-4 text-muted-foreground text-sm">
					This user keeps their profile private.
				</p>
			</main>
		)
	}

	const username = profile.username ?? ""
	const links: { icon: typeof IconBrandX; label: string; href: string }[] = []
	if (profile.leetcodeHandle) {
		links.push({
			icon: IconCode,
			label: `LeetCode · ${profile.leetcodeHandle}`,
			href: `https://leetcode.com/${profile.leetcodeHandle}`,
		})
	}
	if (profile.codeforcesHandle) {
		links.push({
			icon: IconCode,
			label: `Codeforces · ${profile.codeforcesHandle}`,
			href: `https://codeforces.com/profile/${profile.codeforcesHandle}`,
		})
	}
	if (profile.twitterHandle) {
		links.push({
			icon: IconBrandX,
			label: `@${profile.twitterHandle}`,
			href: `https://x.com/${profile.twitterHandle}`,
		})
	}
	if (profile.linkedinHandle) {
		links.push({
			icon: IconBrandLinkedin,
			label: profile.linkedinHandle,
			href: `https://linkedin.com/in/${profile.linkedinHandle}`,
		})
	}
	if (profile.websiteUrl) {
		links.push({
			icon: IconLink,
			label: profile.websiteUrl.replace(/^https?:\/\//, ""),
			href: profile.websiteUrl,
		})
	}

	return (
		<main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
			<header className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
				<HashAvatar username={username} size={96} isPro={profile.isPro} />
				<div className="flex min-w-0 flex-1 flex-col gap-1">
					<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
						<h1 className="font-semibold text-2xl tracking-tight">{profile.name}</h1>
						{profile.isPro && <ProBadge />}
					</div>
					<p className="font-mono text-muted-foreground text-sm">@{username}</p>
					{profile.bio && <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>}
				</div>
			</header>

			{links.length > 0 && (
				<section className="grid gap-2 sm:grid-cols-2">
					{links.map((link) => (
						<Stat key={link.href} {...link} />
					))}
				</section>
			)}

			<SolveHeatmap username={username} />
			<AchievementsSection badges={profile.badges} isPro={profile.isPro} />
		</main>
	)
}
