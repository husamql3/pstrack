"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"

const MODS = ["ctrl", "alt", "shift", "meta"] as const

const isMod = (p: string): boolean => (MODS as readonly string[]).includes(p)

const IGNORE_FOCUS = new Set(["INPUT", "TEXTAREA", "SELECT"])

export type UseKeypressOptions = {
	/** One or more chords, e.g. `"meta+k"` or `["ctrl+b", "meta+b"]` - any match fires `callback`. */
	combo: string | string[]
	callback: (event: KeyboardEvent) => void
	/** When true, calls `preventDefault()` if a chord matches. Default is true. */
	preventDefault?: boolean
	/** Element to attach to; omit for `window`. */
	target?: HTMLElement | null
}

function normalize(combo: string): string {
	const parts = combo
		.toLowerCase()
		.split("+")
		.map((s) => s.trim())
	const M = MODS as readonly string[]
	const mods = parts.filter(isMod).sort((a, b) => M.indexOf(a) - M.indexOf(b))
	const keys = parts.filter((p) => !isMod(p))
	return [...mods, ...keys].join("+")
}

function matches(e: KeyboardEvent, norm: string): boolean {
	const segs = norm.split("+")
	const wantMods = segs.filter(isMod)
	const wantKey = segs.find((p) => !isMod(p))
	const haveMods = [
		e.ctrlKey && "ctrl",
		e.altKey && "alt",
		e.shiftKey && "shift",
		e.metaKey && "meta",
	].filter(Boolean) as string[]

	if (
		wantMods.length !== haveMods.length ||
		!wantMods.every((m) => haveMods.includes(m))
	) {
		return false
	}
	return e.key.toLowerCase() === wantKey
}

/**
 * Listens for `keydown` shortcut chords. Skips firing while focus is in an input,
 * textarea, select, or `contentEditable` region.
 */
export function useKeypress({
	combo,
	callback,
	preventDefault = true,
	target,
}: UseKeypressOptions) {
	const callbackRef = useRef(callback)
	useEffect(() => {
		callbackRef.current = callback
	}, [callback])

	const normalized = useMemo(
		() => (Array.isArray(combo) ? combo : [combo]).map(normalize),
		[combo]
	)

	const onKeyDown = useCallback(
		(ev: Event) => {
			const e = ev as KeyboardEvent
			const el = e.target as HTMLElement | undefined
			if (IGNORE_FOCUS.has(el?.tagName ?? "") || el?.isContentEditable) {
				return
			}
			for (const chord of normalized) {
				if (!matches(e, chord)) {
					continue
				}
				if (preventDefault) {
					e.preventDefault()
				}
				callbackRef.current(e)
				break
			}
		},
		[normalized, preventDefault]
	)

	useEffect(() => {
		const el = target ?? window
		el.addEventListener("keydown", onKeyDown)
		return () => el.removeEventListener("keydown", onKeyDown)
	}, [onKeyDown, target])
}
