import { createFileRoute } from "@tanstack/react-router"

import { LetterGlitch } from "@/components/letter-glitch"
import { Header } from "@/features/home/components/header"
import { Hero } from "@/features/home/components/hero"

export const Route = createFileRoute("/")({ component: App })

function App() {
	return (
		<>
			<LetterGlitch
				glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
				glitchSpeed={150}
				centerVignette
				outerVignette
				smooth
			/>

			<Header />
			<Hero />
		</>
	)
}
