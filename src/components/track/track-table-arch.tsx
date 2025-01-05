'use client'

import { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { LeetCoder, Problem, Submission, TableRow } from '@/types/table.type'
import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

const dates = ['29/02', '23/02', '22/02', '21/02', '20/02', '19/02', '18/02', '17/02', '16/02']

const columnHelper = createColumnHelper<TableRow>()

const columns = [
  columnHelper.accessor('user', {
    header: 'LeetCoders',
    cell: (info) => <div>@{info.getValue().username}</div>,
  }),
  columnHelper.accessor('problem', {
    header: 'Problem',
    cell: (info) => (
      <div>
        <a
          href={info.getValue().pLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {info.getValue().pNumber}
        </a>
      </div>
    ),
  }),
  columnHelper.accessor('problem.pTopic', {
    header: 'Type',
    cell: (info) => <span className="text-sm text-gray-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor('problem.difficulty', {
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

const TrackTableArch = ({ problems, users }: { problems: Problem[]; users: LeetCoder[] }) => {
  const data = useMemo(() => {
    return users
      .map((user) => {
        return problems.map((problem) => ({
          user,
          problem,
          submissions: dates.reduce(
            (acc, date) => {
              acc[date] = null // Replace with actual submission data if available
              return acc
            },
            {} as { [key: string]: Submission | null }
          ),
        }))
      })
      .flat()
  }, [problems, users])

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

export default TrackTableArch
