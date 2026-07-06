import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { AdminGroupDetailResponse } from "@/server/admin/admin.type"
import type {
	GroupMemberResponse,
	JoinRequestResponse,
} from "@/server/groups/groups.type"

export const adminGroupDetailKey = (groupId: string) =>
	["admin", "groups", groupId] as const
export const adminGroupMembersKey = (groupId: string) =>
	["admin", "groups", groupId, "members"] as const
export const adminGroupJoinRequestsKey = (groupId: string) =>
	["admin", "groups", groupId, "join-requests"] as const
export const adminPendingRequestsKey = ["admin", "join-requests", "pending"] as const

export const useAdminGroup = (groupId: string) =>
	useQuery<AdminGroupDetailResponse>({
		queryKey: adminGroupDetailKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v3.admin.groups({ id: groupId }).get()
			if (error) throw new Error("Failed to load group")
			return data as AdminGroupDetailResponse
		},
		staleTime: 1000 * 30,
	})

export const useAdminGroupMembers = (groupId: string) =>
	useQuery<GroupMemberResponse[]>({
		queryKey: adminGroupMembersKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v3.admin.groups({ id: groupId }).members.get()
			if (error) throw new Error("Failed to load members")
			return data as GroupMemberResponse[]
		},
		staleTime: 1000 * 30,
	})

export const useAdminGroupJoinRequests = (groupId: string) =>
	useQuery<JoinRequestResponse[]>({
		queryKey: adminGroupJoinRequestsKey(groupId),
		queryFn: async () => {
			const { data, error } = await api.v3.admin
				.groups({ id: groupId })
				["join-requests"].get()
			if (error) throw new Error("Failed to load join requests")
			return data as JoinRequestResponse[]
		},
		staleTime: 1000 * 15,
	})

export const useAdminPendingRequests = () =>
	useQuery({
		queryKey: adminPendingRequestsKey,
		queryFn: async () => {
			const { data, error } = await api.v3.admin.groups["pending-requests"].get()
			if (error) throw new Error("Failed to load pending requests")
			return data
		},
		staleTime: 1000 * 15,
	})

export const useAdminUpdateJoinRequest = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({
			requestId,
			action,
		}: {
			requestId: string
			action: "APPROVED" | "REJECTED"
		}) => {
			const { data, error } = await api.v3.admin
				.groups({ id: groupId })
				["join-requests"]({ requestId })
				.patch({ action })
			if (error) throw new Error("Could not process join request")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminGroupJoinRequestsKey(groupId) })
			queryClient.invalidateQueries({ queryKey: adminGroupDetailKey(groupId) })
			queryClient.invalidateQueries({ queryKey: adminPendingRequestsKey })
		},
	})
}

export const useAdminRemoveMember = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (userId: string) => {
			const { data, error } = await api.v3.admin
				.groups({ id: groupId })
				.members({ userId })
				.delete()
			if (error) throw new Error("Could not remove member")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminGroupMembersKey(groupId) })
			queryClient.invalidateQueries({ queryKey: adminGroupDetailKey(groupId) })
		},
	})
}

export const useAdminGenerateInvite = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (expiresIn: "7d" | "30d" | "90d" | "never") => {
			const { data, error } = await api.v3.admin
				.groups({ id: groupId })
				.invite.post({ expiresIn })
			if (error) throw new Error("Could not generate invite link")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminGroupDetailKey(groupId) })
		},
	})
}

export const useAdminRevokeInvite = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v3.admin.groups({ id: groupId }).invite.delete()
			if (error) throw new Error("Could not revoke invite link")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminGroupDetailKey(groupId) })
		},
	})
}

export const useAdminStartGroup = (groupId: string) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const { data, error } = await api.v3.admin.groups({ id: groupId }).start.patch()
			if (error) throw new Error("Could not start group")
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: adminGroupDetailKey(groupId) })
			queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
		},
	})
}
