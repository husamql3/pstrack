'use client'

import { leetcoders } from '@/data/dummy'
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'

export type ProblemData = {
  problemOrder: number
  problem: {
    id: string
    topic: string
    difficulty: string
    link: string
    problem_no: number
  }
  totalSolved: number
  userSubmissions: {
    user_id: string
    solved: boolean
  }[]
  groupProgressDate: string | null
}

// Function to generate user columns with conditional disabling
export const getUserColumns = (currentUserId: string | null) =>
  leetcoders.map((user) => ({
    id: user.id,
    header: () => <div className="">@{user.username}</div>,
    cell: ({ row }: { row: { original: ProblemData } }) => {
      const userSubmission = row.original.userSubmissions.find(
        (sub: { user_id: string; solved: boolean }) => sub.user_id === user.id
      )
      return (
        <Checkbox
          checked={userSubmission?.solved || false}
          disabled={(currentUserId && user.id !== currentUserId) || userSubmission?.solved} // Disable if not the current user
        />
      )
    },
  }))

// Define the columns for the table
export const getColumns = (currentUserId: string | null): ColumnDef<ProblemData>[] => [
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
    columns: getUserColumns(currentUserId), // Pass currentUserId to generate user columns
  },
]
