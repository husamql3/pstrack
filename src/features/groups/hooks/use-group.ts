import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { ProFeatureError } from "@/lib/errors"
import type { GroupDetailResponse } from "@/server/groups/groups.type"

export const groupDetailQueryKey = (groupId: string) => ["groups", groupId] as const

export const useGroup = (groupId: string) =>
	useQuery<GroupDetailResponse>({
		queryKey: groupDetailQueryKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v3.groups({ id: groupId }).get()
			if (error) throw new Error("Failed to load group")
			return data as GroupDetailResponse
		},
		staleTime: 1000 * 60,
	})

export const useJoinByInvite = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (inviteCode: string) => {
			const { data, error } = await api.v3.groups["join-by-invite"].post({ inviteCode })
			if (error) {
				if (error.status === 403) throw new ProFeatureError("multiple-groups")
				throw new Error("Invalid or expired invite link")
			}
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["groups"] })
		},
	})
}
