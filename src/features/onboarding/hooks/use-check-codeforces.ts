import { useMutation } from "@tanstack/react-query"

import { api } from "@/lib/api"

export const useCheckCodeforces = () =>
	useMutation({
		mutationFn: async (handle: string) => {
			const { data, error } = await api.v4.users["validate-codeforces"].post({ handle })
			if (error) throw new Error("Could not verify Codeforces handle")
			return data.exists
		},
	})
