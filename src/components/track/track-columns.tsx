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
) => {
  return leetcoders.map((user) => ({
    id: user.id,
    header: () => <div className="">@{user.username}</div>, // todo: replace with hover card
    cell: ({ row }: { row: { original: TrackTableType } }) => {
      const userSubmission = row.original.userSubmissions.find(
        (sub: { user_id: string; solved: boolean }) => sub.user_id === user.id
      )

      const handleSubmit = async () => {
        const result = await submitDailyProblem({
          user_id: user.id,
          problem_id: row.original.problem.id,
          group_no: groupId,
        })
        if (!result) {
          throw new Error('Failed to submit daily problem')
        }
      }

      return (
        <Checkbox
          checked={userSubmission?.solved || false}
          disabled={
            (currentUserId && user.id !== currentUserId) || // Disable if not the current user
            userSubmission?.solved // Disable if already solved
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
    cell: ({ row }: { row: { original: TrackTableType } }) => {
      const groupProgressDate = row.original.groupProgressDate
      return <span className="text-xs text-zinc-100">{groupProgressDate}</span>
    },
  },
  {
    accessorKey: 'problemOrder',
    header: 'Problem',
    sortingFn: 'alphanumeric',
    enableSorting: true,
    cell: ({ row }: { row: { original: TrackTableType } }) => {
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
    cell: ({ row }: { row: { original: TrackTableType } }) => {
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
    cell: ({ row }: { row: { original: TrackTableType } }) => {
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
  },
  {
    id: 'userSubmissions',
    columns: getUserColumns(currentUserId, leetcoders, submitDailyProblem, groupId),
  },
]
