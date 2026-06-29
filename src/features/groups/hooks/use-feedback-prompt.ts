import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useFeedbackPrompt = (groupId: string) =>
	useQuery({
		queryKey: ["feedback", "prompt", groupId],
		queryFn: async () => {
			const { data, error } = await api.v3.feedbacks.prompt.get({ query: { groupId } })
			if (error) throw new Error("Failed to check feedback prompt")
			return data
		},
		staleTime: Number.POSITIVE_INFINITY,
	})
