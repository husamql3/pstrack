"use client"

import { IconSearch } from "@tabler/icons-react"
import { useRef } from "react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import { useKeypress } from "@/hooks/use-keypress"

export function AppSearch() {
	const groupRef = useRef<HTMLDivElement>(null)
	const { setOpen } = useSidebar()

	useKeypress({
		combo: ["meta+k", "ctrl+k"],
		callback: () => {
			const input = groupRef.current?.querySelector<HTMLInputElement>(
				"[data-slot=input-group-control]"
			)
			input?.focus({ preventScroll: true })
			setOpen(true)
		},
	})

	return (
		<InputGroup ref={groupRef}>
			<InputGroupAddon align="inline-start" className="pl-1.75">
				<IconSearch />
			</InputGroupAddon>
			<InputGroupInput
				aria-label="Search"
				name="q"
				placeholder="Search..."
				type="search"
			/>
			<InputGroupAddon align="inline-end">
				<KbdGroup>
					<Kbd>⌘</Kbd>
					<Kbd>K</Kbd>
				</KbdGroup>
			</InputGroupAddon>
		</InputGroup>
	)
}
