import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { PublicProfileResponse } from "@/server/users/users.type"

export const usePublicProfile = (username: string) =>
	useQuery({
		queryKey: ["users", "public", username] as const,
		queryFn: async (): Promise<PublicProfileResponse | null> => {
			const { data, error } = await api.v3.users({ username }).get()
			if (error) {
				if (error.status === 404) return null
				throw new Error("Couldn't load profile")
			}
			return data as PublicProfileResponse
		},
		staleTime: 1000 * 60,
	})
