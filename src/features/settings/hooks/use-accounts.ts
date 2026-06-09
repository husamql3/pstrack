import { useQuery } from "@tanstack/react-query"

import { authClient } from "@/lib/auth-client"

export const ACCOUNTS_QUERY_KEY = ["auth", "accounts"] as const

export type LinkedAccount = {
	id: string
	providerId: string
	accountId: string
	createdAt: Date
}

export const useLinkedAccounts = () =>
	useQuery({
		queryKey: ACCOUNTS_QUERY_KEY,
		queryFn: async (): Promise<LinkedAccount[]> => {
			const { data, error } = await authClient.listAccounts()
			if (error) throw new Error(error.message ?? "Could not load accounts")
			return (data ?? []).map((acc) => ({
				id: acc.id,
				providerId: acc.providerId,
				accountId: acc.accountId,
				createdAt: new Date(acc.createdAt),
			}))
		},
		staleTime: 1000 * 60,
	})
