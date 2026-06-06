import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useAdminStats = () =>
	useQuery({
		queryKey: ["admin", "stats"],
		queryFn: async () => {
			const { data, error } = await api.v4.admin.stats.get()
			if (error) throw new Error("Failed to load stats")
			return data
		},
		staleTime: 30_000,
	})
