import { Link } from "@tanstack/react-router"
import type { Variants } from "motion/react"

import { AnimatedGroup } from "@/components/animated-group"
import { TextEffect } from "@/components/text-effect"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

export const transitionVariants = {
	item: {
		hidden: {
			opacity: 0,
			filter: "blur(12px)",
			y: 12,
		},
		visible: {
			opacity: 1,
			filter: "blur(0px)",
			y: 0,
			transition: {
				type: "spring",
				bounce: 0.3,
				duration: 1.5,
			},
		},
	} satisfies Variants,
}

export function Hero() {
	const { data: session } = useSession()
	const isLoggedIn = Boolean(session?.user)

	return (
		<section className="h-dvh lg:h-screen">
			<div className="flex h-full items-center justify-center lg:min-h-screen lg:pt-44 lg:pb-56">
				<div className="relative mx-auto flex max-w-xl flex-col items-center px-6">
					<div className="mx-auto max-w-3xl text-center">
						<TextEffect
							preset="fade-in-blur"
							speedSegment={0.3}
							as="h1"
							className="max-w-3xl text-balance font-semibold text-6xl md:text-7xl xl:text-8xl"
						>
							Show up.
						</TextEffect>
						<TextEffect
							preset="fade-in-blur"
							speedSegment={0.3}
							as="h1"
							className="max-w-3xl text-balance font-semibold text-6xl md:text-7xl xl:text-8xl"
						>
							Solve.
						</TextEffect>
						<TextEffect
							preset="fade-in-blur"
							speedSegment={0.3}
							as="h1"
							className="max-w-3xl text-balance font-semibold text-6xl md:text-7xl xl:text-8xl"
						>
							Repeat.
						</TextEffect>
						<TextEffect
							per="line"
							preset="fade-in-blur"
							speedSegment={0.3}
							delay={0.5}
							as="p"
							className="mt-8 max-w-2xl text-pretty rounded-md bg-black p-1 text-lg text-muted-foreground"
						>
							PStrack helps you stay consistent with LeetCode — solve one problem a day,
							earn points, and compete with your study group.
						</TextEffect>

						<AnimatedGroup
							variants={{
								container: {
									visible: {
										transition: {
											staggerChildren: 0.05,
											delayChildren: 0.75,
										},
									},
								},
								...transitionVariants,
							}}
							className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row"
						>
							<Button
								asChild
								size="lg"
								className="bg-zinc-100 px-5 text-base text-black backdrop-blur-sm hover:bg-zinc-200"
							>
								<Link to={isLoggedIn ? "/dashboard" : "/login"}>
									<span className="text-nowrap">Start solving</span>
								</Link>
							</Button>
							<Button
								key={2}
								asChild
								size="lg"
								className="bg-black px-5 text-base backdrop-blur-sm hover:bg-white/5"
							>
								<Link to="/groups">
									<span className="text-nowrap">Browse groups</span>
								</Link>
							</Button>
						</AnimatedGroup>
					</div>
				</div>
			</div>
		</section>
	)
}
