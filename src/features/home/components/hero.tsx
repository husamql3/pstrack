import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

export function Hero() {
	const { data: session } = useSession()
	const isLoggedIn = Boolean(session?.user)

	return (
		<section className="h-[200dvh]">
			<div className="pt-44 pb-32">
				<div className="mask-radial-from-45% mask-radial-to-75% mask-radial-at-top mask-radial-[75%_100%] fixed inset-0 aspect-square opacity-65 md:aspect-9/4 dark:opacity-5">
					<img
						src="https://images.unsplash.com/photo-1740516367177-ae20098c8786?q=80&w=2268&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dt"
						alt="hero background"
						width={2102}
						height={1694}
						className="h-full w-full object-cover object-top"
					/>
				</div>

				<div className="relative z-10 mx-auto w-full max-w-5xl px-6">
					<div className="mx-auto max-w-lg text-center">
						<h1 className="text-balance font-medium text-4xl sm:text-5xl">
							Show up. Solve. Repeat.
						</h1>
						<p className="mt-4 text-balance text-muted-foreground">
							One daily problem from NeetCode 250. Verified automatically. Streaks,
							points, and accountability with your group.
						</p>

						<div className="mt-8 flex flex-wrap items-center justify-center gap-3">
							{isLoggedIn ? (
								<Button asChild size="lg">
									<Link to="/dashboard">Go to dashboard</Link>
								</Button>
							) : (
								<Button asChild size="lg">
									<Link to="/login">Start solving</Link>
								</Button>
							)}
							<Button asChild size="lg" variant="secondary">
								<Link to="/groups">Browse groups</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	)
}
