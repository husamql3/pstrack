import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { userBadgesQueryKey } from "@/features/badges/hooks/use-user-badges"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"
import type { TodayProblemResponse } from "@/server/problems/problems.type"

const todayProblemQueryKey = ["problems", "today"] as const

// One "today" entry per active group. Free users (≤1 group) get an array of length
// ≤1; Pro users in multiple groups get one entry per group.
export const useTodayProblems = ({ enabled = true }: { enabled?: boolean } = {}) =>
	useQuery<TodayProblemResponse[]>({
		queryKey: todayProblemQueryKey,
		queryFn: async () => {
			const { data, error } = await api.v3.problems.today.get()
			if (error) throw new Error("Failed to load today's problems")
			return data
		},
		staleTime: 1000 * 60,
		enabled,
	})

export const useMarkTodaySolved = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (groupId: string) => {
			const { data, error } = await api.v3.problems.today.solve.post({ groupId })
			if (error) throw new Error("Could not mark today's problem solved")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todayProblemQueryKey })
			queryClient.invalidateQueries({ queryKey: ["problems", "roadmap"] })
			queryClient.invalidateQueries({ queryKey: userBadgesQueryKey })
			queryClient.invalidateQueries({ queryKey: ["leaderboard"] })
			authClient.getSession({ fetchOptions: { cache: "no-cache" } })
		},
	})
}

export const usePauseToday = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v3.problems.today.pause.post()
			if (error) throw new Error("Could not pause today's problem")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todayProblemQueryKey })
		},
	})
}
