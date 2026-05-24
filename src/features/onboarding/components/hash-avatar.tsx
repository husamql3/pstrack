import { renderHashvatar } from "hashvatar"
import { useEffect, useRef } from "react"

export const HashAvatar = ({
	username,
	size = 80,
}: {
	username: string
	size?: number
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
		return <div className="rounded-full bg-muted" style={{ width: size, height: size }} />
	}

	return (
		<div className="overflow-hidden rounded-full" style={{ width: size, height: size }}>
			<canvas ref={canvasRef} width={size} height={size} />
		</div>
	)
}
