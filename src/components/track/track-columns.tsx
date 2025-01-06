'use client'

import { ColumnDef } from '@tanstack/react-table'

import { LeetcoderRow } from '@/types/supabase.type'
import { TrackTableType } from '@/types/trackTable.type'

import { Checkbox } from '@/components/luxe/checkbox'

// Function to generate user columns with conditional disabling
export const getUserColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[]
) => {
  return leetcoders.map((user) => ({
    id: user.id,
    header: () => <div className="">@{user.username}</div>,
    cell: ({ row }: { row: { original: TrackTableType } }) => {
      const userSubmission = row.original.userSubmissions.find(
        (sub: { user_id: string; solved: boolean }) => sub.user_id === user.id
      )
      return (
        <Checkbox
          checked={userSubmission?.solved || false}
          disabled={
            (currentUserId && user.id !== currentUserId) || userSubmission?.solved
          } // Disable if not the current user or already solved
        />
      )
    },
  }))
}

// Define the columns for the table
export const getColumns = (
  currentUserId: string | undefined,
  leetcoders: LeetcoderRow[]
): ColumnDef<TrackTableType>[] => [
  {
    accessorKey: 'problem.problem_no',
    header: 'Problem No',
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
  },
  {
    accessorKey: 'totalSolved',
    header: 'Count',
  },
  {
    id: 'userSubmissions',
    header: '',
    columns: getUserColumns(currentUserId, leetcoders),
  },
]
