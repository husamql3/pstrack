import { IconBrandGithubFilled, IconBrandGoogleFilled, IconChevronLeft } from "@tabler/icons-react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";

import LetterGlitch from "@/components/letter-glitch";
import { Button } from "@/components/ui/button";
import { auth, getSession } from "@/lib/auth";
import { Suspense } from "react";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const { session } = await getSession();
		if (session) {
			throw redirect({
				to: "/dashboard",
			});
		}
	},
	loader: () => getSession(),
	pendingComponent: () => {
		return (
			<div className="flex items-center justify-center h-dvh">
				<div className="text-center">
					<p className="text-white">Loading...</p>
				</div>
			</div>
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const router = useRouter();

	const handleOAuthLogin = async (provider: "google" | "github") => {
		await auth.signIn.social({
			provider,
			callbackURL: `${window.location.origin}/dashboard`,
		});

		router.navigate({ to: "/dashboard" });
	};

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<div className="flex items-center justify-center h-dvh relative z-10">
				<div className="absolute inset-0">
					<LetterGlitch
						glitchColors={["#ffffff", "#b4b4b4", "#eaa33f"]}
						glitchSpeed={50}
						outerVignette={false}
						smooth
						centerVignette
					/>
				</div>

				<Link to="/">
					<Button
						className="absolute top-7 left-5 z-10"
						size="lg"
					>
						<IconChevronLeft />
						Home
					</Button>
				</Link>

				<div className="relative flex min-h-screen flex-col justify-center p-4">
					<div className="mx-auto space-y-4 sm:w-sm">
						<div className="flex flex-col space-y-1">
							<h1 className="font-bold text-2xl tracking-wide">Sign In or Join Now!</h1>
							<p className="text-base text-muted-foreground">login or create your pstrack account.</p>
						</div>
						<div className="space-y-2">
							<Button
								className="w-full"
								size="lg"
								type="button"
								onClick={() => handleOAuthLogin("google")}
							>
								<IconBrandGoogleFilled />
								Continue with Google
							</Button>
							<Button
								className="w-full"
								size="lg"
								type="button"
								onClick={() => handleOAuthLogin("github")}
							>
								<IconBrandGithubFilled />
								Continue with GitHub
							</Button>
						</div>

						<p className="mt-8 text-muted-foreground text-sm">
							By clicking continue, you agree to our{" "}
							<Link
								className=" underline-offset-4 hover:text-primary underline"
								to="/"
							>
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link
								className="underline underline-offset-4 hover:text-primary"
								to="/"
							>
								Privacy Policy
							</Link>
							.
						</p>
					</div>
				</div>
			</div>
		</Suspense>
	);
}
