'use client'

import { useState } from 'react'
import type { leetcoders } from '@prisma/client'

import { PROBLEM_BASE_URL, VISIBLE_COUNT } from '@/data/constants'
import type { TableRowOutput } from '@/types/tableRow.type'
import { parseDate } from '@/utils/parseDate'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

const columnHelper = createColumnHelper<TableRowOutput>()

export const TrackTable = ({
  leetcoders,
  tableData,
}: {
  leetcoders: leetcoders[]
  tableData: TableRowOutput[]
}) => {
  const [visibleRecords, setVisibleRecords] = useState(VISIBLE_COUNT)
  const leetcoderSolvedCounts: Record<string, number> = {}

  for (const leetcoder of leetcoders) {
    leetcoderSolvedCounts[leetcoder.id] = tableData.reduce((acc, row) => {
      const hasSolved = row.userSubmissions.some((sub) => sub.user_id === leetcoder.id)
      return acc + (hasSolved ? 1 : 0)
    }, 0)
  }

  const sortedLeetcoders = [...leetcoders].sort((a, b) => {
    return leetcoderSolvedCounts[b.id] - leetcoderSolvedCounts[a.id]
  })

  const sortedData = [...tableData].sort((a, b) => {
    const dateA = parseDate(a.groupProgressDate || '')
    const dateB = parseDate(b.groupProgressDate || '')
    return dateB.getTime() - dateA.getTime() // Sort in descending order
  })

  const visibleTableData = sortedData.slice(0, visibleRecords)

  const columns = [
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
            href={`${PROBLEM_BASE_URL}/${problem.problem_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open problem in a new tab"
            className="text-blue-600 hover:underline"
          >
            {problem.problem_no}
          </a>
        )
      },
    }),
    columnHelper.accessor('problem.topic', {
      header: () => 'Topic',
      cell: (info) => {
        const topic = info.getValue()
        return (
          <span className="rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap">
            {topic}
          </span>
        )
      },
    }),
    columnHelper.accessor('problem.difficulty', {
      header: () => 'Difficulty',
      cell: (info) => {
        const difficulty = info.getValue()
        return (
          <span className="w-fit rounded-lg px-2 py-1 text-xs font-medium capitalize">
            {difficulty}
          </span>
        )
      },
    }),
    columnHelper.accessor(
      (row) => ({
        totalSolved: row.totalSolved,
        total: leetcoders.length,
      }),
      {
        id: 'count',
        header: () => 'Count',
        cell: (info) => {
          const { totalSolved, total } = info.getValue()
          return (
            <div className="flex items-center justify-between">
              <span className="flex-1 text-right text-xs font-medium">{totalSolved}</span>
              Count
            </div>
          )
        },
      }
    ),
    // Use the sortedLeetcoders array instead of the original leetcoders array
    ...sortedLeetcoders.map((leetcoder) =>
      columnHelper.accessor(
        (row) => row.userSubmissions.find((sub) => sub.user_id === leetcoder.id) || false,
        {
          id: leetcoder.id,
          header: () => (
            <>{leetcoder.username}</>
            // <LeetcoderCard
            //   leetcoderId={leetcoder.id}
            //   leetcoderUser={leetcoder.username}
            //   currentUser={userId === leetcoder.id}
            // />
          ),
          cell: (info) => {
            const problemId = info.row.original.problem.id
            const key = `${leetcoder.id}-${problemId}`
            // const isDisabled =
            //   userId !== leetcoder.id || Boolean(info.getValue()) || checkedState[key]
            // const isChecked = checkedState[key] || Boolean(info.getValue())

            // const handleCheck = async () => {
            // if (isDisabled) return

            // setCheckedState((prev) => ({ ...prev, [key]: true }))

            // const success = await onSubmit({
            //   user_id: leetcoder.id,
            //   lc_username: leetcoder.lc_username,
            //   problem_slug: info.row.original.problem.problem_slug,
            //   problem_id: problemId,
            //   group_no: groupId,
            // })
            // }

            return (
              <div className="flex items-center">
                <Checkbox
                  // checked={isChecked}
                  // disabled={isDisabled}
                  // onCheckedChange={handleCheck}
                  // className={cn(
                  className="rounded-[.3rem] disabled:opacity-100 dark:data-[state=checked]:bg-[#2383E2]"
                  // )}
                />
              </div>
            )
          },
        }
      )
    ),
  ]

  const table = useReactTable({
    data: visibleTableData, // Use the sliced data
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleShowMore = () => {
    setVisibleRecords((prev) => prev + 20) // Increment visible records by 20
  }

  return (
    <div className="w-svw px-3">
      <Table className="mx-auto px-3">
        <TableHeader className="border-t border-zinc-700">
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
                <TableCell
                  key={cell.id}
                  className="text-xs"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter className="border-y border-zinc-700 text-xs font-medium">
          {/* Show "Show More" button if there are more records */}
          {tableData.length > visibleRecords && (
            <TableRow
              className="cursor-pointer border-y border-zinc-700"
              onClick={handleShowMore}
            >
              <TableCell
                colSpan={tableData.length}
                className="flex w-full items-center justify-center py-2 text-xs whitespace-nowrap text-gray-500"
              >
                <MoveDown
                  size={12}
                  className="mr-1"
                />
                Load more
              </TableCell>
              <TableCell colSpan={tableData.length} />
            </TableRow>
          )}

          {/* Show total count */}
          <TableRow className="border-0">
            <TableCell
              colSpan={5}
              className="text-right text-xs font-medium text-gray-500"
            >
              Total
            </TableCell>
            {sortedLeetcoders.map((leetcoder) => (
              <TableCell key={leetcoder.id}>{leetcoderSolvedCounts[leetcoder.id]}</TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
