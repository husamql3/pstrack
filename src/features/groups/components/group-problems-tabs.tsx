import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { GroupProblemsRange } from "@/server/groups/groups.type"
import { GROUP_PROBLEMS_RANGE_LABEL, GROUP_PROBLEMS_RANGES } from "../constants"

export const GroupProblemsTabs = ({
	range,
	onChange,
}: {
	range: GroupProblemsRange
	onChange: (range: GroupProblemsRange) => void
}) => (
	<Tabs
		value={range}
		onValueChange={(v) => {
			const next = GROUP_PROBLEMS_RANGES.find((r) => r === v)
			if (next) onChange(next)
		}}
	>
		<TabsList>
			{GROUP_PROBLEMS_RANGES.map((r) => (
				<TabsTrigger key={r} value={r}>
					{GROUP_PROBLEMS_RANGE_LABEL[r]}
				</TabsTrigger>
			))}
		</TabsList>
	</Tabs>
)
