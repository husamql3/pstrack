import React, { useMemo } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { leetcoders } from '@prisma/client'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableRowOutput } from '@/utils/generateTableData'

const columnHelper = createColumnHelper<TableRowOutput>()

const TrackTable = ({
  tableData,
  leetcoders,
}: {
  tableData: TableRowOutput[]
  leetcoders: leetcoders[]
}) => {
  const columns = useMemo(
    () => [
      columnHelper.accessor('groupProgressDate', {
        header: () => 'Date',
        cell: (info) => info.getValue() || 'N/A',
      }),
      columnHelper.accessor('problem', {
        header: () => 'Problem',
        cell: (info) => {
          const problem = info.getValue()
          return (
            <a
              href={problem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {problem.problem_no}
            </a>
          )
        },
      }),
      columnHelper.accessor('problem.topic', {
        header: () => 'Topic',
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
      }),
      columnHelper.accessor('problem.difficulty', {
        header: () => 'Difficulty',
        cell: (info) => {
          const difficulty = info.getValue()
          return (
            <span
              className={
                difficulty === 'easy'
                  ? 'text-green-600'
                  : difficulty === 'medium'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }
            >
              {difficulty}
            </span>
          )
        },
      }),
      columnHelper.accessor((row) => `${row.totalSolved}/${row.totalSubmissions}`, {
        id: 'count',
        header: () => 'Count',
        cell: (info) => info.getValue(),
      }),
      ...leetcoders.map((leetcoder) =>
        columnHelper.accessor(
          (row) =>
            row.userSubmissions.find((sub) => sub.user_id === leetcoder.id)?.solved ||
            false,
          {
            id: leetcoder.id,
            header: () => leetcoder.username,
            cell: (info) => (
              <Checkbox
                checked={info.getValue()}
                disabled
                className={info.getValue() ? 'bg-green-500' : 'bg-gray-200'}
              />
            ),
          }
        )
      ),
    ],
    [leetcoders]
  )

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="mx-auto max-w-5xl">
      <Table className="mx-auto w-fit">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-zinc-700 text-xs font-medium"
            >
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className="border-zinc-700 text-xs"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TrackTable
