import { IconStarFilled } from "@tabler/icons-react"
import { renderHashvatar } from "hashvatar"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export const HashAvatar = ({
	username,
	size = 80,
	shape = "circle",
	isPro = false,
	proStar = false,
}: {
	username: string
	size?: number
	shape?: "circle" | "square"
	/** Pro users get a gold ring around the avatar. */
	isPro?: boolean
	/** In list contexts, add a bottom-left gold star overlay (implies a Pro user). */
	proStar?: boolean
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !username) return
		const stop = renderHashvatar(canvas, {
			hash: username,
			size,
			mode: "gradient",
		})
		return stop
	}, [username, size])

	const rounded = shape === "circle" ? "rounded-full" : "rounded-xl"

	const inner = !username ? (
		<div className={cn("bg-muted", rounded)} style={{ width: size, height: size }} />
	) : (
		<div
			className={cn("overflow-hidden", rounded, isPro && "ring-2 ring-warning")}
			style={{ width: size, height: size }}
		>
			<canvas ref={canvasRef} width={size} height={size} />
		</div>
	)

	// Fast path: untouched behaviour for every existing (non-Pro) caller.
	if (!isPro && !proStar) return inner

	const starBox = Math.max(12, Math.round(size * 0.4))

	return (
		<div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
			{inner}
			{proStar && (
				<span
					className="absolute -bottom-0.5 left-0 z-10 inline-flex items-center justify-center rounded-full bg-warning text-warning-foreground ring-2 ring-background"
					style={{ width: starBox, height: starBox }}
				>
					<IconStarFilled
						style={{ width: starBox * 0.6, height: starBox * 0.6 }}
						className="text-white"
					/>
				</span>
			)}
		</div>
	)
}
