import { createFileRoute } from "@tanstack/react-router"

import { Dither } from "@/components/dither"
import { Footer } from "@/features/home/footer"
import { Header } from "@/features/home/header"
import { Hero } from "@/features/home/hero"

export const Route = createFileRoute("/")({ component: App })

function App() {
	return (
		<div className="relative h-dvh overflow-hidden">
			<div className="absolute inset-0">
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
			<Footer />
		</div>
	)
}
