'use client'

import type { leetcoders } from '@prisma/client'
import { flexRender, type Table as TableType } from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'

import type { TableRowOutput } from '@/types/tableRow.type'
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/ui/table'
import { cn } from '@/utils/cn'

export const SmallScreenTable = ({
  table,
  sortedLeetcoders,
  leetcoderSolvedCounts,
  hasMoreToShow,
  handleShowMore,
}: {
  table: TableType<TableRowOutput>
  sortedLeetcoders: leetcoders[]
  leetcoderSolvedCounts: Record<string, number>
  hasMoreToShow: boolean
  handleShowMore: () => void
}) => {
  return (
    <div className="block lg:hidden">
      <Table className="w-full min-w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-zinc-800 transition-colors duration-200"
            >
              {headerGroup.headers.map((header, index) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'px-3 py-2 align-middle font-semibold whitespace-nowrap text-slate-200',
                    index >= 5 && index - 5 === 0 && 'bg-first',
                    index >= 5 && index - 5 === 1 && 'bg-second',
                    index >= 5 && index - 5 === 2 && 'bg-third'
                  )}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn('group border-b border-zinc-800')}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    'px-3 py-2 align-middle whitespace-nowrap',
                    index >= 5 && index - 5 === 0 && 'bg-first',
                    index >= 5 && index - 5 === 1 && 'bg-second',
                    index >= 5 && index - 5 === 2 && 'bg-third',
                    index < 5 ? 'text-slate-200' : 'text-slate-300'
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            {/* Show More Button in first column */}
            <TableCell className="px-3 py-2 align-middle whitespace-nowrap">
              {hasMoreToShow && (
                <button
                  onClick={handleShowMore}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  type="button"
                >
                  <ChevronDown className="size-4" />
                  Show More
                </button>
              )}
            </TableCell>
            {/* Empty cells for problem, topic, difficulty columns */}
            <TableCell colSpan={3} />
            {/* Total Solved in progress column */}
            <TableCell className="text-center align-middle whitespace-nowrap">
              <div className="text-sm font-medium text-slate-300">Total Solved</div>
            </TableCell>
            {/* Individual leetcoder counts */}
            {sortedLeetcoders.map((leetcoder, index) => (
              <TableCell
                key={leetcoder.id}
                className={cn(
                  'group px-3 text-center font-medium whitespace-nowrap transition-colors duration-200',
                  index === 0 && 'bg-first',
                  index === 1 && 'bg-second',
                  index === 2 && 'bg-third'
                )}
              >
                <span className="text-slate-300">{leetcoderSolvedCounts[leetcoder.id] || 0}</span>
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
