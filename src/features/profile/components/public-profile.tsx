import {
	IconBrandGithub,
	IconBrandLinkedin,
	IconBrandX,
	IconCode,
	IconLink,
	IconSparkles,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HashAvatar } from "@/features/onboarding/components/hash-avatar"
import type { PublicProfileResponse } from "@/server/users/users.type"

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

export const PublicProfileSkeleton = () => (
	<main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-16">
		<div className="flex items-center gap-4">
			<Skeleton className="size-20 rounded-full" />
			<div className="flex flex-1 flex-col gap-2">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-4 w-24" />
			</div>
		</div>
		<Skeleton className="h-16 w-full" />
	</main>
)

export const PublicProfileNotFound = ({ username }: { username: string }) => (
	<main className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
		<h1 className="font-semibold text-xl">User not found</h1>
		<p className="text-muted-foreground text-sm">
			No PSTrack user with the username <span className="font-mono">{username}</span>.
		</p>
	</main>
)

export const PublicProfile = ({ profile }: { profile: PublicProfileResponse }) => {
	if (profile.visibility === "PRIVATE") {
		return (
			<main className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
				<HashAvatar username={profile.username} size={80} />
				<div className="flex flex-col items-center gap-1">
					<h1 className="font-semibold text-xl">{profile.name}</h1>
					<p className="font-mono text-muted-foreground text-sm">@{profile.username}</p>
				</div>
				{profile.isPro && (
					<Badge className="gap-1">
						<IconSparkles className="size-3" aria-hidden="true" />
						Pro
					</Badge>
				)}
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
		<main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-16">
			<header className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
				<HashAvatar username={username} size={96} />
				<div className="flex min-w-0 flex-1 flex-col gap-1.5">
					<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
						<h1 className="font-semibold text-2xl tracking-tight">{profile.name}</h1>
						{profile.isPro && (
							<Badge className="gap-1">
								<IconSparkles className="size-3" aria-hidden="true" />
								Pro
							</Badge>
						)}
					</div>
					<p className="font-mono text-muted-foreground text-sm">@{username}</p>
					{profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
				</div>
			</header>

			{/* Brand icon unused: IconBrandGithub. Kept for future GitHub link wiring. */}
			<span className="hidden">
				<IconBrandGithub />
			</span>

			{links.length > 0 && (
				<section className="grid gap-2 sm:grid-cols-2">
					{links.map((link) => (
						<Stat key={link.href} {...link} />
					))}
				</section>
			)}

			<p className="text-muted-foreground text-xs">
				Stats, badges, and activity coming soon.
			</p>
		</main>
	)
}
