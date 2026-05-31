import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"

export type CheckUsernameResult = {
	available: boolean
	reason?: "taken" | "reserved" | "invalid"
}

export const useCheckUsername = () =>
	useMutation({
		mutationFn: async (username: string): Promise<CheckUsernameResult> => {
			const { data, error } = await api.v4.users["check-username"].post({ username })
			if (error) throw new Error("Could not verify username")
			return data as CheckUsernameResult
		},
	})
