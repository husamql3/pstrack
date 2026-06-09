import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { UserBadgesResponse } from "@/server/badges/badges.type"

export const userBadgesQueryKey = ["badges", "me"] as const

export const useUserBadges = () =>
	useQuery<UserBadgesResponse>({
		queryKey: userBadgesQueryKey,
		queryFn: async () => {
			const { data, error } = await api.v3.badges.me.get()
			if (error) throw new Error("Failed to load badges")
			return data as UserBadgesResponse
		},
		staleTime: 1000 * 60 * 2,
	})
