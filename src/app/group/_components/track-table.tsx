'use client'

import { useState, useMemo } from 'react'
import { MoveDown } from 'lucide-react'
import type { leetcoders } from '@prisma/client'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { PROBLEM_BASE_URL, VISIBLE_COUNT } from '@/data/constants'
import type { TableRowOutput } from '@/types/tableRow.type'
import type { Difficulty, Topic } from '@/types/problems.type'
import { parseDate } from '@/utils/parseDate'
import { cn } from '@/utils/cn'
import { getDifficultyColor, getTopicColor } from '@/utils/problemsUtils'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SubmitCheckbox } from '@/app/group/_components/submit-checkbox'
import { LeetCoderCard } from './leetcoder-card'

const columnHelper = createColumnHelper<TableRowOutput>()

export const TrackTable = ({
  leetcoders,
  tableData,
  groupId,
}: {
  leetcoders: leetcoders[]
  tableData: TableRowOutput[]
  groupId: string
}) => {
  const [visibleRecords, setVisibleRecords] = useState(VISIBLE_COUNT)
  const leetcoderSolvedCounts: Record<string, number> = {}

  for (const leetcoder of leetcoders) {
    leetcoderSolvedCounts[leetcoder.id] = tableData.reduce((acc, row) => {
      const hasSolved = row.userSubmissions.some((sub) => sub.user_id === leetcoder.id)
      return acc + (hasSolved ? 1 : 0)
    }, 0)
  }

  // Sort leetcoders by the number of problems solved (descending order)
  const sortedLeetcoders = useMemo(() => {
    return [...leetcoders].sort((a, b) => {
      return leetcoderSolvedCounts[b.id] - leetcoderSolvedCounts[a.id]
    })
  }, [leetcoders])

  const visibleTableData = useMemo(() => {
    // Sort the tableData by groupProgressDate in descending order
    const sortedData = [...tableData].sort((a, b) => {
      const dateA = parseDate(a.groupProgressDate || '')
      const dateB = parseDate(b.groupProgressDate || '')
      return dateB.getTime() - dateA.getTime() // Sort in descending order
    })

    // Slice the sorted data to only show the first `visibleRecords` items
    return sortedData.slice(0, visibleRecords)
  }, [tableData, visibleRecords])

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
          const topic = info.getValue() as Topic
          return (
            <span
              className={cn(
                getTopicColor(topic),
                'rounded-lg px-2 py-0.5 text-sm font-medium whitespace-nowrap'
              )}
            >
              {topic}
            </span>
          )
        },
      }),
      columnHelper.accessor('problem.difficulty', {
        header: () => 'Difficulty',
        cell: (info) => {
          const difficulty = info.getValue() as Difficulty
          return (
            <span
              className={cn(
                getDifficultyColor(difficulty),
                'w-fit rounded-lg px-2 py-0.5 text-sm font-medium capitalize'
              )}
            >
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
                <span className="flex-1 text-right text-sm font-medium">{totalSolved}</span>
                <span className="flex-1 text-right text-sm font-medium">/{total}</span>
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
            header: () => <LeetCoderCard leetcoder={leetcoder} />,
            cell: (info) => {
              return (
                <SubmitCheckbox
                  info={info}
                  leetcoder={leetcoder}
                  groupId={groupId}
                />
              )
            },
          }
        )
      ),
    ],
    [sortedLeetcoders, leetcoders.length, groupId]
  )

  const table = useReactTable({
    data: visibleTableData, // Use the sliced data
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleShowMore = () => {
    setVisibleRecords((prev) => prev + 20) // Increment visible records by 20
  }

  return (
    <div className="w-svw py-5">
      <Table className="mx-auto px-3">
        <TableHeader className="border-t border-zinc-700">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-zinc-700 text-sm font-medium"
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
              className="border-zinc-700 text-sm"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className="text-sm"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>

        <TableFooter className="border-y border-zinc-700 text-sm font-medium">
          {/* Show "Show More" button if there are more records */}
          {tableData.length > visibleRecords && (
            <TableRow
              className="cursor-pointer border-y border-zinc-700"
              onClick={handleShowMore}
            >
              <TableCell
                colSpan={tableData.length}
                className="flex w-full items-center justify-center py-2 text-sm whitespace-nowrap text-gray-500"
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
              className="text-right text-sm font-medium text-gray-500"
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
