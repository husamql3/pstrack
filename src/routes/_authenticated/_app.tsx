import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

import { AppHeader } from "@/components/app-header"

export const Route = createFileRoute("/_authenticated/_app")({
	component: AppLayout,
})

function NavigationProgress() {
	const isLoading = useRouterState({ select: (s) => s.isLoading })
	const [width, setWidth] = useState(0)
	const [opacity, setOpacity] = useState(0)
	const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (isLoading) {
			// Reset and start growing
			setOpacity(1)
			setWidth(0)
			// Kick off the slow crawl to 80% on next frame so the CSS transition runs
			rafRef.current = requestAnimationFrame(() => setWidth(80))
		} else {
			// Snap to 100% then fade out
			setWidth(100)
			timerRef.current = setTimeout(() => setOpacity(0), 200)
			timerRef.current = setTimeout(() => setWidth(0), 500)
		}

		return () => {
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [isLoading])

	return (
		<div
			className="pointer-events-none fixed top-0 left-0 z-60 h-0.5 bg-primary"
			style={{
				width: `${width}%`,
				opacity,
				transition: isLoading
					? "width 2s cubic-bezier(0.1, 0.4, 0.2, 1), opacity 200ms"
					: "width 200ms ease-out, opacity 300ms ease 200ms",
			}}
		/>
	)
}

function AppLayout() {
	return (
		<div className="flex h-screen flex-col">
			<NavigationProgress />
			<AppHeader />
			<main className="mx-auto min-h-0 w-full flex-1 overflow-y-auto px-8 pt-8 pb-4">
				<Outlet />
			</main>
		</div>
	)
}
