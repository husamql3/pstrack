import { useMutation, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { FeedbackFormInput } from "@/server/feedback/feedback.type"

export const useSubmitFeedback = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (input: FeedbackFormInput) => {
			const { data, error } = await api.v3.feedbacks.post({
				groupId: input.groupId,
				category: input.category,
				description: input.description ?? null,
			})
			if (error) throw new Error("Failed to submit feedback")
			return data
		},
		onSuccess: (_, { groupId }) => {
			queryClient.invalidateQueries({ queryKey: ["feedback", "prompt", groupId] })
		},
	})
}
