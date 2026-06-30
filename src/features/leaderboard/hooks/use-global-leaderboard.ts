import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { LeaderboardPeriod } from "../types"

export const globalLeaderboardQueryKey = (period: LeaderboardPeriod) =>
	["leaderboard", "global", period] as const

export const useGlobalLeaderboard = (period: LeaderboardPeriod, enabled: boolean) =>
	useQuery({
		queryKey: globalLeaderboardQueryKey(period),
		queryFn: async () => {
			const { data, error } = await api.v3.leaderboard.global.get({
				query: { period },
			})
			if (error) {
				// TODO: re-enable 403 handling when Pro gate is restored
				// if (
				// 	typeof error === "object" &&
				// 	error !== null &&
				// 	"status" in error &&
				// 	error.status === 403
				// ) {
				// 	throw Object.assign(new Error("Pro required"), { code: "PRO_REQUIRED" })
				// }
				throw new Error("Failed to load global leaderboard")
			}
			return data
		},
		enabled,
		staleTime: 1000 * 60,
	})
