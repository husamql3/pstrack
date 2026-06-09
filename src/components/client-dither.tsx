import { type ComponentProps, type ComponentType, useEffect, useState } from "react"

import type { Dither } from "@/components/dither"

type DitherProps = ComponentProps<typeof Dither>

export function ClientDither(props: DitherProps) {
	const [Component, setComponent] = useState<ComponentType<DitherProps> | null>(null)

	useEffect(() => {
		let cancelled = false
		import("@/components/dither").then((mod) => {
			if (!cancelled) setComponent(() => mod.Dither)
		})
		return () => {
			cancelled = true
		}
	}, [])

	if (!Component) return null
	return <Component {...props} />
}
