import { useCallback, useEffect, useState } from "react"

export type Theme = "light" | "dark" | "system"

function applyTheme(theme: Theme) {
	const root = document.documentElement
	if (theme === "system") {
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
		root.classList.toggle("dark", prefersDark)
	} else {
		root.classList.toggle("dark", theme === "dark")
	}
}

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>(() => {
		if (typeof window === "undefined") return "system"
		return (localStorage.getItem("theme") as Theme) ?? "system"
	})

	useEffect(() => {
		applyTheme(theme)
	}, [theme])

	useEffect(() => {
		if (theme !== "system") return
		const mq = window.matchMedia("(prefers-color-scheme: dark)")
		const handler = () => applyTheme("system")
		mq.addEventListener("change", handler)
		return () => mq.removeEventListener("change", handler)
	}, [theme])

	const setTheme = useCallback((next: Theme) => {
		localStorage.setItem("theme", next)
		setThemeState(next)
	}, [])

	return { theme, setTheme }
}
