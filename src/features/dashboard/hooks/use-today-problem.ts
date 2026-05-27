import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { TodayProblemResponse } from "@/server/problems/problems.type"

const todayProblemQueryKey = ["problems", "today"] as const

export const useTodayProblem = () =>
	useQuery<TodayProblemResponse>({
		queryKey: todayProblemQueryKey,
		queryFn: async () => {
			const { data, error } = await api.v4.problems.today.get()
			if (error) throw new Error("Failed to load today's problem")
			return data
		},
		staleTime: 1000 * 60,
	})

export const useMarkTodaySolved = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v4.problems.today.solve.post()
			if (error) throw new Error("Could not mark today's problem solved")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todayProblemQueryKey })
		},
	})
}

export const usePauseToday = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v4.problems.today.pause.post()
			if (error) throw new Error("Could not pause today's problem")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: todayProblemQueryKey })
		},
	})
}
