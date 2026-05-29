import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { ProFeatureError } from "@/lib/errors"
import type { CreateGroupFormInput, GroupListResponse } from "@/server/groups/groups.type"

const groupsQueryKey = ["groups"] as const

export const useGroups = () =>
	useQuery<GroupListResponse[]>({
		queryKey: groupsQueryKey,
		queryFn: async () => {
			const { data, error } = await api.v4.groups.get()
			if (error) throw new Error("Failed to load groups")
			return data
		},
		staleTime: 1000 * 60,
	})

export const useCreateGroup = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: CreateGroupFormInput) => {
			const { data, error } = await api.v4.groups.post(input)
			if (error) {
				if (error.status === 403) throw new ProFeatureError("multiple-groups")
				throw new Error("Could not create group")
			}
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupsQueryKey })
		},
	})
}

export const useRequestJoinGroup = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (groupId: string) => {
			const { data, error } = await api.v4.groups({ id: groupId }).join.post()
			if (error) {
				if (error.status === 403) throw new ProFeatureError("multiple-groups")
				throw new Error("Could not request to join group")
			}
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupsQueryKey })
		},
	})
}
