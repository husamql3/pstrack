import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { HeatmapDay } from "@/server/users/users.type"

export const useProfileHeatmap = (username: string) =>
	useQuery({
		queryKey: ["users", "heatmap", username] as const,
		queryFn: async (): Promise<HeatmapDay[]> => {
			const { data, error } = await api.v3.users({ username }).heatmap.get()
			if (error) throw new Error("Failed to fetch heatmap")
			return data as HeatmapDay[]
		},
		staleTime: 1000 * 60 * 5,
	})
