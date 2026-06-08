import { useEffect, useState } from "react"

export const useScroll = (threshold: number) => {
	const [scrolled, setScrolled] = useState(false)

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > threshold)
		window.addEventListener("scroll", handleScroll, { passive: true })
		return () => window.removeEventListener("scroll", handleScroll)
	}, [threshold])

	return scrolled
}
