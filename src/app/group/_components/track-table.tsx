'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
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
import { useSubmissionStore } from '@/stores/submissionStore'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { SubmitCheckbox } from '@/app/group/_components/submit-checkbox'
import { LeetCoderCard } from '@/app/group/_components/leetcoder-card'

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
  // Add state to force re-render and re-sort
  const [refreshKey, setRefreshKey] = useState(0)

  // Get the submissions from the store
  const { submissions } = useSubmissionStore()

  // Listen for changes in the submission store and update refreshKey
  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [submissions])

  // Calculate leetcoder solved counts from both API data and local submissions
  const leetcoderSolvedCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}

    // Initialize counts for all leetcoders
    for (const leetcoder of leetcoders) {
      counts[leetcoder.id] = 0
    }

    // Count from API data
    for (const row of tableData) {
      for (const submission of row.userSubmissions) {
        if (counts[submission.user_id] !== undefined) {
          counts[submission.user_id]++
        }
      }
    }

    // Add counts from local submission store
    for (const key in submissions) {
      if (submissions[key]) {
        const [keyGroupId, userId, problemId] = key.split(':')
        // Only count submissions for the current group
        if (keyGroupId === groupId && counts[userId] !== undefined) {
          // Check if this problem's submission isn't already counted from API data
          const alreadyCounted = tableData.some(
            (row) =>
              row.problem.id === problemId &&
              row.userSubmissions.some((sub) => sub.user_id === userId)
          )

          if (!alreadyCounted) {
            counts[userId]++
          }
        }
      }
    }

    return counts
  }, [leetcoders, tableData, submissions, groupId, refreshKey])

  // Sort leetcoders by the number of problems solved (descending order)
  const sortedLeetcoders = useMemo(() => {
    return [...leetcoders].sort((a, b) => {
      return leetcoderSolvedCounts[b.id] - leetcoderSolvedCounts[a.id]
    })
  }, [leetcoders, leetcoderSolvedCounts])

  // Callback to trigger re-sorting after successful submission
  const handleSuccessfulSubmit = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

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
                'rounded-md px-2 py-0.5 text-sm font-medium whitespace-nowrap'
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
                'w-fit rounded-md px-2 py-0.5 text-sm font-medium capitalize'
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
          (row) => {
            // Check both the API data and the local store for submission
            const apiSubmission = row.userSubmissions.find((sub) => sub.user_id === leetcoder.id)
            const storeKey = `${groupId}:${leetcoder.id}:${row.problem.id}`
            const localSubmission = submissions[storeKey]

            return apiSubmission || localSubmission || false
          },
          {
            id: leetcoder.id,
            header: () => <LeetCoderCard leetcoder={leetcoder} />,
            cell: (info) => {
              const problemSlug = info.row.original.problem.problem_slug
              return (
                <SubmitCheckbox
                  info={info}
                  leetcoder={leetcoder}
                  groupId={groupId}
                  problemSlug={problemSlug}
                  onSuccessfulSubmit={handleSuccessfulSubmit}
                />
              )
            },
          }
        )
      ),
    ],
    [
      sortedLeetcoders,
      leetcoderSolvedCounts,
      leetcoders.length,
      groupId,
      handleSuccessfulSubmit,
      submissions,
    ]
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
