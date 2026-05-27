import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type {
	GenerateInviteInput,
	GroupDetailResponse,
	GroupMemberResponse,
	JoinRequestResponse,
	UpdateGroupFormInput,
} from "@/server/groups/groups.type"

export const groupDetailQueryKey = (groupId: string) => ["groups", groupId] as const
export const groupMembersQueryKey = (groupId: string) =>
	["groups", groupId, "members"] as const
export const joinRequestsQueryKey = (groupId: string) =>
	["groups", groupId, "join-requests"] as const

export const useGroup = (groupId: string) =>
	useQuery<GroupDetailResponse>({
		queryKey: groupDetailQueryKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v4.groups({ id: groupId }).get()
			if (error) throw new Error("Failed to load group")
			return data as GroupDetailResponse
		},
		staleTime: 1000 * 60,
	})

export const useGroupMembers = (groupId: string) =>
	useQuery<GroupMemberResponse[]>({
		queryKey: groupMembersQueryKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v4.groups({ id: groupId }).members.get()
			if (error) throw new Error("Failed to load members")
			return data as GroupMemberResponse[]
		},
		staleTime: 1000 * 60,
	})

export const useJoinRequests = (groupId: string) =>
	useQuery<JoinRequestResponse[]>({
		queryKey: joinRequestsQueryKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v4.groups({ id: groupId })["join-requests"].get()
			if (error) throw new Error("Failed to load join requests")
			return data as JoinRequestResponse[]
		},
		staleTime: 1000 * 30,
	})

export const useUpdateJoinRequest = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			requestId,
			action,
		}: {
			requestId: string
			action: "APPROVED" | "REJECTED"
		}) => {
			const { data, error } = await api.v4
				.groups({ id: groupId })
				["join-requests"]({ requestId })
				.patch({ action })
			if (error) throw new Error("Could not process join request")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: joinRequestsQueryKey(groupId) })
			queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) })
		},
	})
}

export const useRemoveMember = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (userId: string) => {
			const { data, error } = await api.v4
				.groups({ id: groupId })
				.members({ userId })
				.delete()
			if (error) throw new Error("Could not remove member")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupMembersQueryKey(groupId) })
			queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) })
		},
	})
}

export const useLeaveGroup = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v4.groups({ id: groupId }).leave.post()
			if (error) throw new Error("Could not leave group")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["groups"] })
		},
	})
}

export const useUpdateGroup = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: UpdateGroupFormInput) => {
			const { data, error } = await api.v4.groups({ id: groupId }).patch(input)
			if (error) throw new Error("Could not update group")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) })
			queryClient.invalidateQueries({ queryKey: ["groups"] })
		},
	})
}

export const useGenerateInvite = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (input: GenerateInviteInput) => {
			const { data, error } = await api.v4.groups({ id: groupId }).invite.post(input)
			if (error) throw new Error("Could not generate invite link")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) })
		},
	})
}

export const useRevokeInvite = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v4.groups({ id: groupId }).invite.delete()
			if (error) throw new Error("Could not revoke invite link")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: groupDetailQueryKey(groupId) })
		},
	})
}

export const useJoinByInvite = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (inviteCode: string) => {
			const { data, error } = await api.v4.groups["join-by-invite"].post({ inviteCode })
			if (error) throw new Error("Invalid or expired invite link")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["groups"] })
		},
	})
}
