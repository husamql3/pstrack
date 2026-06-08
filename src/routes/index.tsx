import { createFileRoute } from "@tanstack/react-router"

import { Dither } from "@/components/dither"
// import { LetterGlitch } from "@/components/letter-glitch"
// import { Header } from "@/features/home/components/header"
// import { Hero } from "@/features/home/components/hero"
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

			{/* <LetterGlitch
				glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
				glitchSpeed={150}
				centerVignette
				outerVignette
				smooth
			/>
			<Header />
			<Hero /> */}
		</>
	)
}
