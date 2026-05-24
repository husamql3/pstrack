import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useCheckUsername = () =>
	useMutation({
		mutationFn: async (username: string) => {
			const { data, error } = await api.v4.users["check-username"].post({ username })
			if (error) throw new Error("Could not verify username")
			return data.available
		},
	})
