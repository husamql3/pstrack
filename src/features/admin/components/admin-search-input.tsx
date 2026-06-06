import { IconSearch } from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useDebounce } from "@/hooks/use-debounce"

export const AdminSearchInput = ({
	initial,
	placeholder = "Search...",
	onChange,
}: {
	initial: string
	placeholder?: string
	onChange: (q: string) => void
}) => {
	const [value, setValue] = useState(initial)
	const debounced = useDebounce(value)
	const onChangeRef = useRef(onChange)
	const didMount = useRef(false)

	useEffect(() => {
		onChangeRef.current = onChange
	})

	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true
			return
		}
		onChangeRef.current(debounced)
	}, [debounced])

	return (
		<InputGroup className="max-w-xs">
			<InputGroupAddon align="inline-start" className="pl-1.75">
				<IconSearch className="size-4" />
			</InputGroupAddon>
			<InputGroupInput
				onChange={(e) => setValue(e.target.value)}
				placeholder={placeholder}
				type="search"
				value={value}
			/>
		</InputGroup>
	)
}
