import { useMutation, useQueryClient } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"
import { SESSION_QUERY_KEY } from "@/lib/session"
import type { ProfileUpdateInput } from "@/server/users/users.type"

export const useSaveProfile = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			username,
			leetcodeHandle,
			codeforcesHandle,
		}: ProfileUpdateInput) => {
			const { error } = await authClient.updateUser({
				username,
				leetcodeHandle,
				codeforcesHandle,
			})
			if (error) throw new Error(error.message ?? "Please try again.")
		},
		// The _authenticated guard reads username/leetcodeHandle from the cached
		// session — drop it so the post-onboarding navigation sees the new values.
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY })
		},
	})
}
