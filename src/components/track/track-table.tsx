'use client'

import { useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Problem, Submission, TableRow, User } from '@/types/table.type'

const dummyUsers: User[] = [
  {
    id: 'u1',
    fname: 'Osama',
    lname: 'Ahmed',
    username: 'osama',
    gh_username: 'osama',
    lc_username: 'osama_lc',
    group_id: 1,
  },
  {
    id: 'u2',
    fname: 'Ward',
    lname: 'Mohamed',
    username: 'ward',
    gh_username: 'ward',
    lc_username: 'ward_lc',
    group_id: 1,
  },
  // Add more users as needed
]

const dummyProblems: Problem[] = [
  {
    id: 1,
    p_number: 735,
    p_link: 'https://leetcode.com/problems/two-sum/',
    p_topic: 'stack',
    difficulty: 'Medium',
  },
  {
    id: 2,
    p_number: 22,
    p_link: 'https://leetcode.com/problems/two-sum/',
    p_topic: 'stack',
    difficulty: 'Easy',
  },
  // Add more problems as needed
]

const dummySubmissions: Submission[] = [
  {
    id: 1,
    user_id: 'u1',
    problem_id: 1,
    solved: true,
    language: 'javascript',
    solution_link: 'https://github.com/solution1',
    created_at: '2024-02-23',
  },
  // Add more submissions as needed
]

const dates = [
  '29/02',
  '23/02',
  '22/02',
  '21/02',
  '20/02',
  '19/02',
  '18/02',
  '17/02',
  '16/02',
  '16/02',
]

const defaultData: TableRow[] = dummyUsers.map((user) => ({
  user,
  problem: dummyProblems[0],
  submissions: dates.reduce(
    (acc, date) => {
      acc[date] =
        dummySubmissions.find(
          (s) =>
            s.user_id === user.id &&
            s.problem_id === dummyProblems[0].id &&
            s.created_at === date.split('/').reverse().join('-')
        ) || null
      return acc
    },
    {} as { [key: string]: Submission | null }
  ),
}))

const columnHelper = createColumnHelper<TableRow>()

const columns = [
  columnHelper.accessor('user', {
    header: 'LeetCoders',
    cell: (info) => <div>@{info.getValue().username}</div>,
  }),
  columnHelper.accessor((row) => `${row.problem.p_number} ${row.problem.p_link}`, {
    header: 'Problem',
    cell: (info) => {
      return (
        <div>
          <a
            href={info.getValue().split(' ')[1]}
            target="_blank"
          >
            {info.getValue().split(' ')[0]}
          </a>
        </div>
      )
    },
  }),
  columnHelper.accessor((row) => row.problem.p_topic, {
    header: 'Type',
    cell: (info) => <span className="text-sm text-gray-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor((row) => row.problem.difficulty, {
    header: 'Difficulty',
    cell: (info) => <Badge className={cn('font-normal')}>{info.getValue()}</Badge>,
  }),
  ...dates.map((date) =>
    columnHelper.accessor((row) => row.submissions[date]?.solved || false, {
      id: date,
      header: date,
      cell: (info) => (
        <Checkbox
          checked={info.getValue()}
          className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      ),
    })
  ),
]

const TrackTable = () => {
  const [data] = useState(() => [...defaultData])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">
      <table className="border-t border-zinc-700">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-zinc-700"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-12 w-20 px-3 text-left align-middle font-normal"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-700"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="p-3 align-middle"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default TrackTable
