import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type {
	GroupActivityEvent,
	GroupTodayActivityResponse,
} from "@/server/groups/groups.type"

export const useGroupTodayActivity = (groupId: string | undefined) =>
	useQuery<GroupTodayActivityResponse>({
		queryKey: ["groups", groupId, "today-activity"],
		queryFn: async () => {
			const { data, error } = await api.v3
				.groups({ id: groupId ?? "" })
				["today-activity"].get()
			if (error) throw new Error("Failed to load group activity")
			return data as GroupTodayActivityResponse & { events: GroupActivityEvent[] }
		},
		enabled: !!groupId,
		staleTime: 1000 * 30,
	})
