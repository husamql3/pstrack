import type { GroupProblemsRange } from "@/server/groups/groups.type"

export const GROUP_PROBLEMS_RANGES: GroupProblemsRange[] = ["7d", "30d", "all"]

export const GROUP_PROBLEMS_RANGE_LABEL: Record<GroupProblemsRange, string> = {
	"7d": "Last 7 days",
	"30d": "Last 30 days",
	all: "All time",
}

export const MEMBER_COL_WIDTH_PX = 44
export const HEADER_HEIGHT_PX = 220
export const ROW_HEIGHT_PX = 56

export const JOIN_LIMIT_FOR_FREE_USER = 1
export const JOIN_LIMIT_FOR_PRO_USER = 5

export const CAPACITY_FOR_FREE_USER = 30
export const CAPACITY_FOR_PRO_USER = 50
