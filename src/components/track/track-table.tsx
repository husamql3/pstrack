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

type LeetCoder = {
  name: string
  problem: string
  type: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  completions: { [key: string]: boolean }
}

const leetCoders: LeetCoder[] = [
  {
    name: 'Osama',
    problem: 'Travel Day',
    type: '',
    difficulty: 'Medium',
    completions: {
      '29/02/2024': false,
      '23/02/2024': false,
      '22/02/2024': false,
    },
  },
  {
    name: 'Ward',
    problem: '735',
    type: 'stack',
    difficulty: 'Medium',
    completions: {
      '29/02/2024': false,
      '23/02/2024': false,
      '22/02/2024': false,
    },
  },
  {
    name: 'Nada',
    problem: '22',
    type: 'stack',
    difficulty: 'Medium',
    completions: {
      '29/02/2024': false,
      '23/02/2024': false,
      '22/02/2024': true,
    },
  },
]

const dates = ['29/02', '23/02', '22/02']

const columnHelper = createColumnHelper<LeetCoder>()

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy':
      return 'bg-green-600/20 text-green-600 hover:bg-green-600/30'
    case 'Medium':
      return 'bg-yellow-600/20 text-yellow-600 hover:bg-yellow-600/30'
    case 'Hard':
      return 'bg-red-600/20 text-red-600 hover:bg-red-600/30'
    default:
      return 'bg-gray-600/20 text-gray-600 hover:bg-gray-600/30'
  }
}

const columns = [
  columnHelper.accessor('name', {
    header: 'LeetCoders',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('problem', {
    header: 'Problem',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('type', {
    header: 'Type',
    cell: (info) => <span className="text-sm text-gray-400">{info.getValue()}</span>,
  }),
  columnHelper.accessor('difficulty', {
    header: 'Difficulty',
    cell: (info) => (
      <Badge className={cn('font-medium', getDifficultyColor(info.getValue()))}>
        {info.getValue()}
      </Badge>
    ),
  }),
  ...dates.map((date) =>
    columnHelper.accessor((row) => row.completions[date], {
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
  const [data] = useState(() => [...leetCoders])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full overflow-x-auto">
      <div className="rounded-md">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="bg-muted/50 border-b"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-muted-foreground h-12 px-4 text-left align-middle font-medium"
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
                className="hover:bg-muted/50 border-b transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-4 align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TrackTable
