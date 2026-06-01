import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query"
import { useMemo } from "react"

import type { BadgeType } from "@/generated/prisma/enums"
import { api } from "@/lib/api"
import type {
	GroupProblemsMember,
	GroupProblemsRange,
	GroupProblemsResponse,
	GroupProblemsRow,
} from "@/server/groups/groups.type"
import type { TodayProblemResponse } from "@/server/problems/problems.type"

type SolveResult = { today: TodayProblemResponse; newBadges: BadgeType[] }

export const groupProblemsQueryKey = (groupId: string, range: GroupProblemsRange) =>
	["groups", groupId, "problems", range] as const

const fetchPage = async (
	groupId: string,
	range: GroupProblemsRange,
	cursor?: string
): Promise<GroupProblemsResponse> => {
	const { data, error } = await api.v4
		.groups({ id: groupId })
		.problems.get({ query: { range, ...(cursor ? { cursor } : {}) } })
	if (error) throw new Error("Failed to load group problems")
	return data as GroupProblemsResponse
}

type UnifiedGroupProblems = {
	members: GroupProblemsMember[]
	rows: GroupProblemsRow[]
	isLoading: boolean
	isError: boolean
	hasNextPage: boolean
	isFetchingNextPage: boolean
	fetchNextPage: () => void
}

export const useGroupProblems = (
	groupId: string,
	range: GroupProblemsRange
): UnifiedGroupProblems => {
	const fixed = useQuery<GroupProblemsResponse>({
		queryKey: groupProblemsQueryKey(groupId, range),
		queryFn: () => fetchPage(groupId, range),
		enabled: range !== "all",
		staleTime: 1000 * 30,
	})

	const infinite = useInfiniteQuery<
		GroupProblemsResponse,
		Error,
		{ pages: GroupProblemsResponse[]; pageParams: (string | undefined)[] },
		ReturnType<typeof groupProblemsQueryKey>,
		string | undefined
	>({
		queryKey: groupProblemsQueryKey(groupId, "all"),
		queryFn: ({ pageParam }) => fetchPage(groupId, "all", pageParam),
		initialPageParam: undefined,
		getNextPageParam: (last) => last.nextCursor ?? undefined,
		enabled: range === "all",
		staleTime: 1000 * 30,
	})

	return useMemo(() => {
		if (range === "all") {
			const pages = infinite.data?.pages ?? []
			const firstMembers = pages[0]?.members ?? []
			const rows = pages.flatMap((p) => p.rows)
			return {
				members: firstMembers,
				rows,
				isLoading: infinite.isLoading,
				isError: infinite.isError,
				hasNextPage: !!infinite.hasNextPage,
				isFetchingNextPage: infinite.isFetchingNextPage,
				fetchNextPage: () => {
					if (infinite.hasNextPage && !infinite.isFetchingNextPage) {
						infinite.fetchNextPage()
					}
				},
			}
		}
		return {
			members: fixed.data?.members ?? [],
			rows: fixed.data?.rows ?? [],
			isLoading: fixed.isLoading,
			isError: fixed.isError,
			hasNextPage: false,
			isFetchingNextPage: false,
			fetchNextPage: () => {},
		}
	}, [range, fixed.data, fixed.isLoading, fixed.isError, infinite])
}

export const useMarkTodaySolvedFromTable = (
	groupId: string,
	range: GroupProblemsRange
) => {
	const queryClient = useQueryClient()
	return useMutation<SolveResult>({
		mutationFn: async () => {
			const { data, error } = await api.v4.problems.today.solve.post()
			console.log(error)
			if (error) throw new Error(error.value?.error ?? "Could not verify solve")
			return data as SolveResult
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: groupProblemsQueryKey(groupId, range),
			})
			queryClient.invalidateQueries({ queryKey: ["problems", "today"] })
		},
	})
}
