import { useMutation } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

import type { ProfileUpdateInput } from "@/server/users/users.type"

export const useSaveProfile = () =>
	useMutation({
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
	})
