'use client'

import { ColumnDef } from '@tanstack/react-table'

import { LeetcoderRow } from '@/types/supabase.type'
import { NeetCodeTopic } from '@/types/neetCodeTopic.type'
import { TrackTableType } from '@/types/trackTable.type'
import { Difficulty } from '@/types/difficulty.type'

import { cn } from '@/lib/utils'
import { getDifficultyColor } from '@/utils/getDifficultyColor'
import { getTopicColor } from '@/utils/getTopicColor'

import { Checkbox } from '@/components/luxe/checkbox'

// Function to generate user columns with conditional disabling
export const getUserColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[],
  handleSubmit: (user_id: string, problem_id: string) => void
): ColumnDef<TrackTableType>[] => {
  return leetcoders.map((user) => ({
    id: user.id,
    header: () => <div className="">@{user.username}</div>, // todo: replace with hover card
    cell: ({ row }) => {
      const userSubmission = row.original.userSubmissions.find(
        (sub: { user_id: string; solved: boolean }) => sub.user_id === user.id
      )

      return (
        <Checkbox
          checked={userSubmission?.solved || false}
          disabled={
            (currentUserId && user.id !== currentUserId) || // Disable if not the current user
            userSubmission?.solved || // Disable if already solved
            !Boolean(user.id) // Disable if there is no user id (user is not logged in)
          }
          onChange={() => handleSubmit(user.id, row.original.problem.id)}
        />
      )
    },
  }))
}

// Define the columns for the table
export const getColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[],
  handleSubmit: (user_id: string, problem_id: string) => void
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
  ...getUserColumns(currentUserId, leetcoders, handleSubmit),
]
