'use client'

import { ColumnDef } from '@tanstack/react-table'
import { LeetcoderRow } from '@/types/supabase.type'
import { TrackTableType } from '@/types/trackTable.type'
import { SubmitDailyProblem } from '@/types/submitDailyProblem.type'
import { getDifficultyColor } from '@/utils/getDifficultyColor'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/luxe/checkbox'
import { Difficulty } from '@/types/difficulty.type'
import { getTopicColor } from '@/utils/getTopicColor'
import { NeetCodeTopic } from '@/types/neetCodeTopic.type'

// Function to generate user columns with conditional disabling
export const getUserColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[],
  submitDailyProblem: ({
    user_id,
    problem_id,
    group_no,
  }: SubmitDailyProblem) => Promise<boolean>,
  groupId: number
): ColumnDef<TrackTableType>[] => {
  return leetcoders.map((user) => ({
    id: user.id,
    header: () => <div className="">@{user.username}</div>, // todo: replace with hover card
    cell: ({ row }) => {
      const userSubmission = row.original.userSubmissions.find(
        (sub: { user_id: string; solved: boolean }) => sub.user_id === user.id
      )

      const handleSubmit = async () => {
        const result = await submitDailyProblem({
          user_id: user.id,
          problem_id: row.original.problem.id,
          group_no: groupId,
        })
        console.log(result)
        if (!result) {
          // show toast instead of throwing error
          throw new Error('Failed to submit daily problem')
        }
      }

      return (
        <Checkbox
          checked={userSubmission?.solved || false}
          disabled={
            (currentUserId && user.id !== currentUserId) || // Disable if not the current user
            userSubmission?.solved || // Disable if already solved
            !Boolean(user.id) // Disable if there is no user id (user is not logged in)
          }
          onChange={handleSubmit}
        />
      )
    },
  }))
}

// Define the columns for the table
export const getColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[],
  submitDailyProblem: ({ user_id, problem_id }: SubmitDailyProblem) => Promise<boolean>,
  groupId: number
): ColumnDef<TrackTableType>[] => [
  {
    accessorKey: 'groupProgressDate',
    header: 'Date',
    cell: ({ row }) => {
      const groupProgressDate = row.original.groupProgressDate
      return <span className="text-xs text-zinc-100">{groupProgressDate}</span>
    },
  },
  {
    accessorKey: 'problemOrder',
    header: 'Problem',
    sortingFn: 'alphanumeric',
    enableSorting: true,
    cell: ({ row }) => {
      const problem = row.original.problem
      return (
        <a
          href={problem.link}
          className="text-xs font-medium text-blue-600 underline"
        >
          {problem.problem_no}
        </a>
      )
    },
  },
  {
    accessorKey: 'problem.topic',
    header: 'Topic',
    cell: ({ row }) => {
      const topic = row.original.problem.topic as NeetCodeTopic
      return (
        <div
          className={cn(
            'w-fit rounded-lg px-2 py-1 text-xs font-medium',
            getTopicColor(topic)
          )}
        >
          {topic}
        </div>
      )
    },
  },
  {
    accessorKey: 'problem.difficulty',
    header: 'Difficulty',
    cell: ({ row }) => {
      const difficulty = row.original.problem.difficulty as Difficulty
      return (
        <span
          className={cn(
            'w-fit rounded-lg px-2 py-1 text-xs font-medium',
            getDifficultyColor(difficulty)
          )}
        >
          {difficulty}
        </span>
      )
    },
  },
  {
    accessorKey: 'totalSolved',
    header: 'Count',
    cell: ({ row }) => {
      const totalSolved = row.original.totalSolved
      const totalUsers = leetcoders.length

      return (
        <div className="flex items-baseline">
          <span className="font-medium">{totalSolved}</span>
          <span className="text-xs text-zinc-500">/{totalUsers}</span>
        </div>
      )
    },
  },
  ...getUserColumns(currentUserId, leetcoders, submitDailyProblem, groupId),
]
