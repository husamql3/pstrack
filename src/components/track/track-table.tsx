'use client'

import { useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Problem, Submission, TableRow, User } from '@/types/table.type'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const dummyUsers: User[] = [
  {
    id: 'u1',
    name: 'Osama',
    username: 'osama',
    ghUsername: 'osama',
    lcUsername: 'osama_lc',
    groupId: 1,
  },
  {
    id: 'u2',
    name: 'Ward',
    username: 'ward',
    ghUsername: 'ward',
    lcUsername: 'ward_lc',
    groupId: 1,
  },
  // Add more users as needed
]

const dummyProblems: Problem[] = [
  {
    id: 1,
    pNumber: 735,
    pLink: 'https://leetcode.com/problems/two-sum/',
    pTopic: 'stack',
    difficulty: 'Medium',
  },
  {
    id: 2,
    pNumber: 22,
    pLink: 'https://leetcode.com/problems/two-sum/',
    pTopic: 'stack',
    difficulty: 'Easy',
  },
  // Add more problems as needed
]

const dummySubmissions: Submission[] = [
  {
    id: 1,
    userId: 'u1',
    pId: 1,
    solved: true,
    language: 'javascript',
    solutionLink: 'https://github.com/solution1',
    createdAt: '2024-02-23',
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
            s.userId === user.id &&
            s.pId === dummyProblems[0].id &&
            s.createdAt === date.split('/').reverse().join('-')
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
  columnHelper.accessor((row) => `${row.problem.pNumber} ${row.problem.pLink}`, {
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
  columnHelper.accessor((row) => row.problem.pTopic, {
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
