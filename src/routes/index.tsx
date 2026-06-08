import { createFileRoute } from "@tanstack/react-router"

import { Dither } from "@/components/dither"
import { Header } from "@/features/home/header"
import { Hero } from "@/features/home/hero"

export const Route = createFileRoute("/")({ component: App })

function App() {
	return (
		<>
			<div className="absolute h-dvh w-full">
				<Dither
					waveColor={[0.30980392156862746, 0.30980392156862746, 0.30980392156862746]}
					disableAnimation={false}
					enableMouseInteraction
					mouseRadius={0.3}
					colorNum={4}
					pixelSize={2}
					waveAmplitude={0.3}
					waveFrequency={3}
					waveSpeed={0.03}
				/>
			</div>

			<Header />
			<Hero />
		</>
	)
}
