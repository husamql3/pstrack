import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { RoadmapKey, RoadmapProblemResponse } from "@/server/problems/problems.type"
import { DEFAULT_ROADMAP_KEY } from "../constants"

export const useRoadmap = (roadmap: RoadmapKey = DEFAULT_ROADMAP_KEY) =>
	useQuery<RoadmapProblemResponse[]>({
		queryKey: ["problems", "roadmap", roadmap],
		queryFn: async () => {
			const { data, error } = await api.v3.problems.roadmap.get({ query: { roadmap } })
			if (error) throw new Error("Failed to load roadmap")
			return data
		},
		staleTime: 1000 * 60 * 5,
		// Keep previous roadmap's data visible while the next one loads -
		// prevents the skeleton flash when switching tabs.
		placeholderData: keepPreviousData,
	})
