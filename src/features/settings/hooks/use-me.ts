import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api"
import type { MeResponse } from "@/server/users/users.type"

export const ME_QUERY_KEY = ["users", "me"] as const

const throwIfError = (error: unknown) => {
	if (!error) return
	const message =
		typeof error === "object" && error !== null && "value" in error
			? ((error as { value: { error?: string } }).value.error ?? "Request failed")
			: "Request failed"
	throw new Error(message)
}

export const useMe = () =>
	useQuery({
		queryKey: ME_QUERY_KEY,
		queryFn: async (): Promise<MeResponse> => {
			const { data, error } = await api.v3.users.me.get()
			throwIfError(error)
			return data as MeResponse
		},
		staleTime: 1000 * 30,
	})

const useMeMutation = <Input>(fn: (input: Input) => Promise<MeResponse>) => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: fn,
		onSuccess: (me) => {
			queryClient.setQueryData(ME_QUERY_KEY, me)
		},
	})
}

export const useUpdateUsername = () =>
	useMeMutation(async (username: string) => {
		const { data, error } = await api.v3.users.me.username.patch({ username })
		throwIfError(error)
		return data as MeResponse
	})

type UpdateProfileBody = Partial<{
	name: string
	bio: string | null
	twitterHandle: string | null
	linkedinHandle: string | null
	websiteUrl: string | null
	isPublic: boolean
}>

export const useUpdateProfile = () =>
	useMeMutation(async (input: UpdateProfileBody) => {
		const { data, error } = await api.v3.users.me.profile.patch(input)
		throwIfError(error)
		return data as MeResponse
	})

type UpdateHandlesBody = {
	leetcodeHandle: string
	codeforcesHandle: string | null
}

export const useUpdateHandles = () =>
	useMeMutation(async (input: UpdateHandlesBody) => {
		const { data, error } = await api.v3.users.me.handles.patch(input)
		throwIfError(error)
		return data as MeResponse
	})

type UpdateNotificationsBody = {
	notifyDailyProblem: boolean
	notifyAchievements: boolean
	notifyGroupActivity: boolean
}

export const useUpdateNotifications = () =>
	useMeMutation(async (input: UpdateNotificationsBody) => {
		const { data, error } = await api.v3.users.me.notifications.patch(input)
		throwIfError(error)
		return data as MeResponse
	})
