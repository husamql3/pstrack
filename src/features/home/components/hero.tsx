import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"

export function Hero() {
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
					<div className="mx-auto max-w-md text-center">
						<h1 className="text-balance font-medium text-4xl sm:text-5xl">
							Ship faster. Integrate smarter.
						</h1>
						<p className="mt-4 text-balance text-muted-foreground">
							Veil is your all-in-one engine for adding seamless integrations to your app.
						</p>

						<Button asChild className="mt-6 pr-1.5">
							<Link to="/login">
								<span className="text-nowrap">Start Building</span>
							</Link>
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}
