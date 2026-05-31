import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { SessionResponse } from "@/server/users/users.type"

export const SESSIONS_QUERY_KEY = ["users", "me", "sessions"] as const

const throwIfError = (error: unknown) => {
	if (!error) return
	throw new Error(
		typeof error === "object" && error !== null && "value" in error
			? ((error as { value: { error?: string } }).value.error ?? "Request failed")
			: "Request failed"
	)
}

export const useSessions = () =>
	useQuery({
		queryKey: SESSIONS_QUERY_KEY,
		queryFn: async (): Promise<SessionResponse[]> => {
			const { data, error } = await api.v4.users.me.sessions.get()
			throwIfError(error)
			return data as SessionResponse[]
		},
		staleTime: 1000 * 30,
	})

export const useRevokeSession = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id: string) => {
			const { error } = await api.v4.users.me.sessions({ id }).delete()
			throwIfError(error)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
		},
	})
}

export const useRevokeOtherSessions = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			const { error } = await api.v4.users.me.sessions.others.delete()
			throwIfError(error)
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY })
		},
	})
}
