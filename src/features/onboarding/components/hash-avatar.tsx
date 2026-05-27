import { renderHashvatar } from "hashvatar"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export const HashAvatar = ({
	username,
	size = 80,
	shape = "circle",
}: {
	username: string
	size?: number
	shape?: "circle" | "square"
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas || !username) return
		const stop = renderHashvatar(canvas, {
			hash: username,
			size,
			mode: "gradient",
			animated: false,
		})
		return stop
	}, [username, size])

	if (!username) {
		return (
			<div
				className={cn("bg-muted", shape === "circle" ? "rounded-full" : "rounded-xl")}
				style={{ width: size, height: size }}
			/>
		)
	}

	return (
		<div
			className={cn(
				"overflow-hidden",
				shape === "circle" ? "rounded-full" : "rounded-xl"
			)}
			style={{ width: size, height: size }}
		>
			<canvas ref={canvasRef} width={size} height={size} />
		</div>
	)
}
