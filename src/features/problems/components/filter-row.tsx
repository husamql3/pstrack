import { IconCheck, IconSearch } from "@tabler/icons-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Difficulty } from "@/generated/prisma/enums"
import { useDebounce } from "@/hooks/use-debounce"
import { DIFFICULTY_FILTER_KEYS, STATUS_FILTER_KEYS } from "../constants"
import type { DifficultyFilter, StatusFilter } from "../types"

export const FilterRow = ({
	initialQuery,
	difficulty,
	status,
	onQueryChange,
	onDifficultyChange,
	onStatusChange,
}: {
	initialQuery: string
	difficulty: DifficultyFilter
	status: StatusFilter
	onQueryChange: (q: string) => void
	onDifficultyChange: (d: DifficultyFilter) => void
	onStatusChange: (s: StatusFilter) => void
}) => {
	const [inputValue, setInputValue] = useState(initialQuery)
	const debouncedQ = useDebounce(inputValue)
	const didMount = useRef(false)
	// Keep a stable ref so the effect below doesn't need onQueryChange as a dep,
	// avoiding a re-fire when the parent re-renders and recreates the callback.
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

	const handleDifficultyChange = useCallback(
		(v: string) => {
			const filter = DIFFICULTY_FILTER_KEYS.find((f) => f === v)
			if (filter !== undefined) onDifficultyChange(filter)
		},
		[onDifficultyChange]
	)

	const handleStatusChange = useCallback(
		(v: string) => {
			const filter = STATUS_FILTER_KEYS.find((f) => f === v)
			if (filter !== undefined) onStatusChange(filter)
		},
		[onStatusChange]
	)

	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
			<InputGroup className="max-w-xs sm:w-auto sm:max-w-[min(320px,100%)]">
				<InputGroupAddon align="inline-start" className="pl-1.75">
					<IconSearch className="size-4" />
				</InputGroupAddon>
				<InputGroupInput
					onChange={(e) => setInputValue(e.target.value)}
					placeholder="Search problems..."
					type="search"
					value={inputValue}
				/>
			</InputGroup>

			<div className="flex flex-wrap items-center gap-2">
				<Tabs onValueChange={handleDifficultyChange} value={difficulty}>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value={Difficulty.EASY}>
							Easy
							<span className="size-1.5 rounded-full bg-emerald-500" />
						</TabsTrigger>
						<TabsTrigger value={Difficulty.MEDIUM}>
							Medium
							<span className="size-1.5 rounded-full bg-amber-500" />
						</TabsTrigger>
						<TabsTrigger value={Difficulty.HARD}>
							Hard
							<span className="size-1.5 rounded-full bg-red-500" />
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Tabs onValueChange={handleStatusChange} value={status}>
					<TabsList>
						<TabsTrigger value="all">All</TabsTrigger>
						<TabsTrigger value="solved">
							<IconCheck className="size-3.5" />
							Solved
						</TabsTrigger>
						<TabsTrigger value="unsolved">Unsolved</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>
		</div>
	)
}
