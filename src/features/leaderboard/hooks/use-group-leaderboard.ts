import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { LeaderboardPeriod } from "../types"

export const groupLeaderboardQueryKey = (groupId: string, period: LeaderboardPeriod) =>
	["leaderboard", "group", groupId, period] as const

export const useGroupLeaderboard = (
	groupId: string | undefined,
	period: LeaderboardPeriod
) =>
	useQuery({
		queryKey: groupId
			? groupLeaderboardQueryKey(groupId, period)
			: ["leaderboard", "group", "none"],
		queryFn: async () => {
			if (!groupId) return null
			const { data, error } = await api.v3.leaderboard.groups({ id: groupId }).get({
				query: { period },
			})
			if (error) throw new Error("Failed to load group leaderboard")
			return data
		},
		enabled: !!groupId,
		staleTime: 1000 * 60,
	})
