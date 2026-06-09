import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

export type AdminUserListFilters = {
	q?: string
	role?: "admin" | "user"
	isPro?: boolean
	banned?: boolean
	cursor?: string
	limit?: number
}

export const useAdminUsers = (filters: AdminUserListFilters) =>
	useQuery({
		queryKey: ["admin", "users", filters],
		queryFn: async () => {
			const { data, error } = await api.v3.admin.users.get({
				query: {
					...(filters.q ? { q: filters.q } : {}),
					...(filters.role ? { role: filters.role } : {}),
					...(filters.isPro !== undefined ? { isPro: filters.isPro } : {}),
					...(filters.banned !== undefined ? { banned: filters.banned } : {}),
					...(filters.cursor ? { cursor: filters.cursor } : {}),
					...(filters.limit ? { limit: filters.limit } : {}),
				},
			})
			if (error) throw new Error("Failed to load users")
			return data
		},
		staleTime: 10_000,
	})

export const useAdminUser = (id: string | undefined) =>
	useQuery({
		queryKey: ["admin", "users", id],
		enabled: !!id,
		queryFn: async () => {
			if (!id) throw new Error("Missing user id")
			const { data, error } = await api.v3.admin.users({ id }).get()
			if (error) throw new Error("Failed to load user")
			return data
		},
	})

export const useAdminUserPointsHistory = (id: string | undefined) =>
	useQuery({
		queryKey: ["admin", "users", id, "points-history"],
		enabled: !!id,
		queryFn: async () => {
			if (!id) throw new Error("Missing user id")
			const { data, error } = await api.v3.admin.users({ id })["points-history"].get({
				query: {},
			})
			if (error) throw new Error("Failed to load points history")
			return data
		},
	})
