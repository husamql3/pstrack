'use client'

import { ColumnDef } from '@tanstack/react-table'

import { LeetcoderRow } from '@/types/supabase.type'
import { TrackTableType } from '@/types/trackTable.type'
import { SubmitDailyProblem } from '@/types/submitDailyProblem.type'
import { getDifficultyColor } from '@/utils/getDifficultyColor'
import { cn } from '@/lib/utils'

import { Checkbox } from '@/components/luxe/checkbox'

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
    accessorKey: 'problemOrder',
    header: 'Problem',
    sortingFn: 'alphanumeric',
    enableSorting: true,
  },
  {
    accessorKey: 'groupProgressDate',
    header: 'Date',
  },
  {
    accessorKey: 'problem.topic',
    header: 'Topic',
  },
  {
    accessorKey: 'problem.difficulty',
    header: 'Difficulty',
    cell: ({ row }: { row: { original: TrackTableType } }) => {
      const difficulty = row.original.problem.difficulty as 'Easy' | 'Medium' | 'Hard'

      const difficultyClasses = (() => {
        switch (difficulty) {
          case 'Easy':
            return 'bg-[#2cbb5d40] text-[rgb(0,184,163)]'
          case 'Medium':
            return 'bg-[#ffc01e40] text-[rgb(255,192,30)]'
          case 'Hard':
            return 'bg-[#ef474340] text-[rgb(255,55,95)]'
          default:
            return 'bg-gray-100 text-gray-500'
        }
      })()

      return (
        <span
          className={cn('rounded-lg px-2 py-1 text-xs font-medium', difficultyClasses)}
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
    header: '',
    columns: getUserColumns(currentUserId, leetcoders, submitDailyProblem, groupId),
  },
]
