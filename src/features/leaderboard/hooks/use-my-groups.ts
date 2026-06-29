import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const myGroupsQueryKey = ["leaderboard", "my-groups"] as const

export const useMyGroups = () =>
	useQuery({
		queryKey: myGroupsQueryKey,
		queryFn: async () => {
			const { data, error } = await api.v3.leaderboard["my-groups"].get()
			if (error) throw new Error("Failed to load your groups")
			return data
		},
		staleTime: 1000 * 60 * 5,
	})
