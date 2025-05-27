'use client'

import { ChevronDown } from 'lucide-react'
import type { leetcoders } from '@prisma/client'
import { flexRender, type Table as TableType } from '@tanstack/react-table'

import type { TableRowOutput } from '@/types/tableRow.type'
import { cn } from '@/utils/cn'

import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/ui/table'

export const LargeScreenTable = ({
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
    <div className="hidden lg:flex lg:flex-col">
      <div className="flex">
        {/* Fixed Columns */}
        <div className="flex-shrink-0">
          <Table className="w-auto">
            <TableHeader className="border-r !border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-zinc-800 transition-colors duration-200"
                >
                  {headerGroup.headers.slice(0, 5).map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-3 py-2 align-middle font-semibold whitespace-nowrap text-slate-200"
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
                  className={cn('group !border-r border-zinc-800')}
                >
                  {row
                    .getVisibleCells()
                    .slice(0, 5)
                    .map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2 align-middle whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>

            <TableFooter className="border-r !border-zinc-800">
              <TableRow>
                <TableCell
                  colSpan={1}
                  className="px-3 py-2 align-middle whitespace-nowrap"
                >
                  {hasMoreToShow && (
                    <button
                      onClick={handleShowMore}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <ChevronDown className="size-4" />
                      Show More
                    </button>
                  )}
                </TableCell>
                <TableCell colSpan={3} />
                <TableCell
                  colSpan={1}
                  className="text-center align-middle whitespace-nowrap"
                >
                  <div className="text-sm font-medium text-slate-300">Total Solved</div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Scrollable Leetcoder Columns */}
        <div className="flex-1 overflow-x-auto">
          <Table className="w-auto">
            <TableHeader className="border-b border-zinc-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-zinc-800 transition-colors duration-200"
                >
                  {headerGroup.headers.slice(5).map((header, index) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'px-3 py-2 align-middle font-semibold whitespace-nowrap text-slate-200',
                        index === 0 && 'bg-first',
                        index === 1 && 'bg-second',
                        index === 2 && 'bg-third'
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
                  {row
                    .getVisibleCells()
                    .slice(5)
                    .map((cell, index) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'px-3 py-2 align-middle text-slate-300',
                          index === 0 && 'bg-first',
                          index === 1 && 'bg-second',
                          index === 2 && 'bg-third'
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
      </div>
    </div>
  )
}
