import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useCheckLeetcode = () =>
	useMutation({
		mutationFn: async (handle: string) => {
			const { data, error } = await api.v4.users["validate-leetcode"].post({ handle })
			if (error) throw new Error("Could not verify LeetCode handle")
			return data.exists
		},
	})
