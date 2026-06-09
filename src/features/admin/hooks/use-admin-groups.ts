import { useMutation, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { AdminCreateGroupInput } from "@/server/admin/admin.type"

export type AdminGroupFilters = {
	q?: string
	type?: "PUBLIC" | "PRIVATE"
	frozen?: boolean
	isActive?: boolean
	cursor?: string
}

export const useAdminCreateGroup = () =>
	useMutation({
		mutationFn: async (input: AdminCreateGroupInput) => {
			const { data, error } = await api.v3.admin.groups.post(input)
			if (error) throw new Error("Failed to create group")
			return data
		},
	})

export const useAdminGroups = (filters: AdminGroupFilters) =>
	useQuery({
		queryKey: ["admin", "groups", filters],
		queryFn: async () => {
			const { data, error } = await api.v3.admin.groups.get({
				query: {
					...(filters.q ? { q: filters.q } : {}),
					...(filters.type ? { type: filters.type } : {}),
					...(filters.frozen !== undefined ? { frozen: filters.frozen } : {}),
					...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
					...(filters.cursor ? { cursor: filters.cursor } : {}),
				},
			})
			if (error) throw new Error("Failed to load groups")
			return data
		},
	})
