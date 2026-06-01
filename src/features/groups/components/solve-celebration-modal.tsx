import { IconAward, IconBolt, IconFlame, IconTrophy } from "@tabler/icons-react"
import confetti from "canvas-confetti"
import { Dialog as DialogPrimitive } from "radix-ui"
import type { ReactNode } from "react"
import { useLayoutEffect, useRef } from "react"

import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import type { BadgeType } from "@/generated/prisma/enums"
import { cn } from "@/lib/utils"
import {
	BADGE_CATEGORY,
	BADGE_DESCRIPTIONS,
	BADGE_LABELS,
} from "@/server/badges/badges.type"
import { FIRST_IN_GROUP_BONUS } from "@/server/points/points.type"
import type { SolveCelebrationData } from "../types"

const BANNER_CONFETTI_DEFAULTS = {
	spread: 360,
	ticks: 50,
	gravity: 0,
	decay: 0.94,
	startVelocity: 30,
	origin: { x: 0.5, y: 0.5 },
	colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
}

const fireBannerStars = (banner: HTMLElement) => {
	const rect = banner.getBoundingClientRect()
	const origin = {
		x: (rect.left + rect.width / 2) / window.innerWidth,
		y: (rect.top + rect.height / 2) / window.innerHeight,
	}
	const defaults = { ...BANNER_CONFETTI_DEFAULTS, origin }

	const shoot = () => {
		confetti({
			...defaults,
			particleCount: 40,
			scalar: 1.2,
			shapes: ["star"],
			zIndex: 60,
		})
		confetti({
			...defaults,
			particleCount: 10,
			scalar: 0.75,
			shapes: ["circle"],
			zIndex: 60,
		})
	}

	const t0 = window.setTimeout(shoot, 16)
	const t1 = window.setTimeout(shoot, 116)
	const t2 = window.setTimeout(shoot, 216)
	return () => {
		window.clearTimeout(t0)
		window.clearTimeout(t1)
		window.clearTimeout(t2)
	}
}

const BADGE_CATEGORY_STYLES: Record<
	"streak" | "volume" | "social",
	{ icon: ReactNode; border: string; iconBg: string; iconColor: string }
> = {
	streak: {
		icon: <IconFlame className="size-5" />,
		border: "ring-amber-500/30",
		iconBg: "bg-amber-500/15",
		iconColor: "text-amber-400",
	},
	volume: {
		icon: <IconAward className="size-5" />,
		border: "ring-emerald-500/30",
		iconBg: "bg-emerald-500/15",
		iconColor: "text-emerald-400",
	},
	social: {
		icon: <IconBolt className="size-5" />,
		border: "ring-purple-500/30",
		iconBg: "bg-purple-500/15",
		iconColor: "text-purple-400",
	},
}

export const SolveCelebrationModal = ({
	data,
	onClose,
}: {
	data: SolveCelebrationData | null
	onClose: () => void
}) => {
	const bannerRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		if (!data) return

		let cancelled = false
		let clearShootTimeouts: (() => void) | undefined
		let frame = 0
		let attempts = 0

		const startConfetti = () => {
			if (cancelled || attempts++ > 48) return

			const banner = bannerRef.current
			if (!banner || banner.clientWidth === 0 || banner.clientHeight === 0) {
				frame = requestAnimationFrame(startConfetti)
				return
			}

			clearShootTimeouts?.()
			clearShootTimeouts = fireBannerStars(banner)
		}

		frame = requestAnimationFrame(startConfetti)

		return () => {
			cancelled = true
			cancelAnimationFrame(frame)
			clearShootTimeouts?.()
		}
	}, [data])

	const sessionPoints =
		(data?.pointsEarned ?? 0) + (data?.isFirstInGroup ? FIRST_IN_GROUP_BONUS : 0)

	return (
		<Dialog open={!!data} onOpenChange={(open) => !open && onClose()}>
			{data ? (
				<DialogPortal>
					<DialogOverlay />
					<DialogPrimitive.Content className="data-open:fade-in-0 data-open:zoom-in-95 data-closed:fade-out-0 data-closed:zoom-out-95 fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-[#0d0e10] outline-none ring-1 ring-white/10 duration-150 data-closed:animate-out data-open:animate-in sm:max-w-md">
						<div
							aria-hidden="true"
							className="absolute inset-0 isolate hidden overflow-hidden contain-strict lg:block"
						>
							<div className="absolute inset-0 -top-14 isolate -z-10 bg-[radial-gradient(35%_80%_at_49%_0%,--theme(--color-primary/.2),transparent)] contain-strict" />
						</div>

						{/* Hero banner */}
						<div
							ref={bannerRef}
							className="relative flex flex-col items-center justify-center gap-1.5 overflow-hidden pt-6 pb-4"
						>
							<span className="relative z-10 font-bold text-5xl text-white tabular-nums leading-none">
								+{sessionPoints}
								<span className="ml-1.5 font-semibold text-2xl text-zinc-400">
									points
								</span>
							</span>
							<p className="text-xs text-zinc-500">
								+{data.pointsEarned} Daily solve
								{data.isFirstInGroup ? ` · +${FIRST_IN_GROUP_BONUS} First in group` : ""}
							</p>
						</div>

						{/* Body */}
						<div className="flex flex-col gap-5 px-6 pt-5 pb-6 text-center">
							<div className="flex flex-col gap-1.5">
								<h2 className="font-bold text-[1.55rem] text-white leading-tight">
									Solved today's problem.
								</h2>
								<p className="text-sm text-zinc-400">{data.problemTitle}</p>
							</div>

							<div className="grid grid-cols-2 gap-2.5">
								<StatCard
									icon={<IconFlame className="size-[18px] text-orange-400" />}
									value={`${data.currentStreak}d`}
									label="Streak"
								/>
								<StatCard
									icon={<IconTrophy className="size-[18px] text-emerald-400" />}
									value={data.totalPoints.toLocaleString()}
									label="Points"
								/>
							</div>

							{data.newBadges.length > 0 && (
								<div className="flex flex-col gap-2">
									{data.newBadges.map((badge) => (
										<BadgeCard key={badge} badge={badge} />
									))}
								</div>
							)}
						</div>
					</DialogPrimitive.Content>
				</DialogPortal>
			) : null}
		</Dialog>
	)
}

const BadgeCard = ({ badge }: { badge: BadgeType }) => {
	const category = BADGE_CATEGORY[badge]
	const styles = BADGE_CATEGORY_STYLES[category]
	return (
		<div
			className={cn(
				"flex items-center gap-3.5 rounded-xl px-4 py-3 text-left ring-1",
				"bg-white/3",
				styles.border
			)}
		>
			<div
				className={cn(
					"flex shrink-0 items-center justify-center rounded-lg p-2.5",
					styles.iconBg,
					styles.iconColor
				)}
			>
				{styles.icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-semibold text-sm text-white leading-snug">
					{BADGE_LABELS[badge]}
				</p>
				<p className="mt-0.5 text-xs text-zinc-500 leading-snug">
					{BADGE_DESCRIPTIONS[badge]}
				</p>
			</div>
		</div>
	)
}

const StatCard = ({
	icon,
	value,
	label,
}: {
	icon: ReactNode
	value: string | number
	label: string
}) => (
	<div className="flex flex-col items-start gap-2 rounded-xl bg-white/[0.05] px-4 py-3.5 ring-1 ring-white/[0.06]">
		{icon}
		<span className="font-semibold text-[1.55rem] text-white tabular-nums leading-none">
			{value}
		</span>
		<span className="font-medium text-[10px] text-zinc-500 uppercase tracking-[0.12em]">
			{label}
		</span>
	</div>
)
