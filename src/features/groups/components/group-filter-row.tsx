import { IconSearch } from "@tabler/icons-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/hooks/use-debounce"
import { TYPE_FILTER_KEYS, type TypeFilter } from "../types"

export const GroupFilterRow = ({
	initialQuery,
	type,
	onQueryChange,
	onTypeChange,
}: {
	initialQuery: string
	type: TypeFilter
	onQueryChange: (q: string) => void
	onTypeChange: (t: TypeFilter) => void
}) => {
	const [inputValue, setInputValue] = useState(initialQuery)
	const debouncedQ = useDebounce(inputValue)
	const didMount = useRef(false)
	const onQueryChangeRef = useRef(onQueryChange)
	useEffect(() => {
		onQueryChangeRef.current = onQueryChange
	})

	useEffect(() => {
		if (!didMount.current) {
			didMount.current = true
			return
		}
		onQueryChangeRef.current(debouncedQ)
	}, [debouncedQ])

	const handleTypeChange = useCallback(
		(v: string) => {
			const filter = TYPE_FILTER_KEYS.find((f) => f === v)
			if (filter !== undefined) onTypeChange(filter)
		},
		[onTypeChange]
	)

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
			<InputGroup className="sm:max-w-xs" variant="ghost">
				<InputGroupAddon align="inline-start" className="pl-1.75">
					<IconSearch className="size-4" />
				</InputGroupAddon>
				<InputGroupInput
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Search groups..."
					type="search"
					value={inputValue}
				/>
			</InputGroup>

			<Tabs onValueChange={handleTypeChange} value={type}>
				<TabsList variant="ghost">
					<TabsTrigger value="all">All</TabsTrigger>
					<TabsTrigger value="public">Public</TabsTrigger>
					<TabsTrigger value="private">Private</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	)
}
