import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { auth } from "@/auth";

// Server function for email/password signup
export const signupFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string; name?: string }) => data)
	.handler(async ({ data }) => {
		const { email, password, name } = data;

		try {
			// Sign up with Better Auth
			const result = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: name || email.split("@")[0],
				},
			});
			console.log("SIGNUP RESULT:", result);

			if (!result) {
				return { error: "Failed to create account" };
			}

			// Session is automatically created by Better Auth
			// Redirect to dashboard
			return { success: true };
		} catch (error) {
			console.error("Signup error:", error);
			return {
				error: error instanceof Error ? error.message : "Failed to create account",
			};
		}
	});

// Server function for email/password login
export const loginFn = createServerFn({ method: "POST" })
	.inputValidator((data: { email: string; password: string }) => data)
	.handler(async ({ data }) => {
		const { email, password } = data;

		try {
			// Sign in with Better Auth
			const result = await auth.api.signInEmail({
				body: {
					email,
					password,
				},
			});

			if (!result) {
				return { error: "Invalid credentials" };
			}

			// Session is automatically created by Better Auth
			// Redirect to dashboard
			return { success: true };
		} catch (error) {
			console.error("Login error:", error);
			return {
				error: error instanceof Error ? error.message : "Invalid credentials",
			};
		}
	});

export const Route = createFileRoute("/login")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			if (isLogin) {
				const result = await loginFn({ data: { email, password } });
				if (result?.error) {
					setError(result.error);
				} else if (result?.success) {
					// Navigate on success
					navigate({ to: "/dashboard" });
				}
			} else {
				const result = await signupFn({ data: { email, password, name } });
				if (result?.error) {
					setError(result.error);
				} else if (result?.success) {
					// Navigate on success
					navigate({ to: "/dashboard" });
				}
			}
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = () => {
		// Redirect to Better Auth Google OAuth endpoint
		window.location.href = "/api/auth/signin/google";
	};

	const handleGithubLogin = () => {
		// Redirect to Better Auth GitHub OAuth endpoint
		window.location.href = "/api/auth/signin/github";
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
						{isLogin ? "Sign in to your account" : "Create a new account"}
					</h2>
				</div>

				<form
					className="mt-8 space-y-6"
					onSubmit={handleSubmit}
				>
					<div className="rounded-md shadow-sm -space-y-px">
						{!isLogin && (
							<div>
								<label
									htmlFor="name"
									className="sr-only"
								>
									Name
								</label>
								<input
									id="name"
									name="name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
									placeholder="Name (optional)"
								/>
							</div>
						)}
						<div>
							<label
								htmlFor="email-address"
								className="sr-only"
							>
								Email address
							</label>
							<input
								id="email-address"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 ${
									isLogin ? "rounded-t-md" : ""
								} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
								placeholder="Email address"
							/>
						</div>
						<div>
							<label
								htmlFor="password"
								className="sr-only"
							>
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete={isLogin ? "current-password" : "new-password"}
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Password"
							/>
						</div>
					</div>

					{error && (
						<div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
							<div className="text-sm text-red-800 dark:text-red-200">{error}</div>
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Processing..." : isLogin ? "Sign in" : "Sign up"}
						</button>
					</div>

					<div className="flex items-center justify-center">
						<button
							type="button"
							onClick={() => {
								setIsLogin(!isLogin);
								setError("");
							}}
							className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
						>
							{isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
						</button>
					</div>

					<div className="mt-6">
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t border-gray-300 dark:border-gray-700" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
									Or continue with
								</span>
							</div>
						</div>

						<div className="mt-6 grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={handleGoogleLogin}
								className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								<svg
									className="w-5 h-5"
									viewBox="0 0 24 24"
								>
									<path
										fill="currentColor"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="currentColor"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="currentColor"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="currentColor"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								<span className="ml-2">Google</span>
							</button>

							<button
								type="button"
								onClick={handleGithubLogin}
								className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
							>
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										fillRule="evenodd"
										d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
										clipRule="evenodd"
									/>
								</svg>
								<span className="ml-2">GitHub</span>
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
