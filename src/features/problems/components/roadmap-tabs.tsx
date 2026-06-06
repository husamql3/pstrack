import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RoadmapKey } from "@/server/problems/problems.type"
import { ROADMAP_KEYS, ROADMAP_LABELS } from "../constants"

export const RoadmapTabs = ({
	value,
	onChange,
}: {
	value: RoadmapKey
	onChange: (roadmap: RoadmapKey) => void
}) => (
	<Tabs
		onValueChange={(v) => {
			const road = ROADMAP_KEYS.find((r) => r === v)
			if (road !== undefined) onChange(road)
		}}
		value={value}
	>
		<TabsList variant="ghost">
			{ROADMAP_KEYS.map((r) => (
				<TabsTrigger key={r} value={r}>
					{ROADMAP_LABELS[r]}
				</TabsTrigger>
			))}
		</TabsList>
	</Tabs>
)
