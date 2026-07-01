import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useSubmitGeneralFeedback = () =>
	useMutation({
		mutationFn: async (description?: string) => {
			const { data, error } = await api.v3.feedbacks.general.post({
				description: description ?? null,
			})
			if (error) throw new Error("Failed to submit feedback")
			return data
		},
	})
