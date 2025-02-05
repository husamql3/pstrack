import { useMemo, useState } from 'react'
import { MoveDown } from 'lucide-react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { TableRowOutput } from '@/types/tableRow.type'
import { Difficulty } from '@/types/difficulty.type'
import { getDifficultyColor } from '@/utils/getDifficultyColor'
import { TrackTableProps } from '@/types/TrackTableProps.type'
import { cn } from '@/lib/utils'
import { getTopicColor } from '@/utils/getTopicColor'
import { PROBLEM_BASE_URL } from '@/data/CONSTANTS'
import { Topic } from '@/types/topics.type'
import { parseDate } from '@/utils/parseDate'

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
import CountChart from '@/components/track/count-chart'
import { LeetcoderCard } from '@/components/track/leetcoder-card'

const columnHelper = createColumnHelper<TableRowOutput>()

export const TrackTable = ({
  tableData,
  leetcoders,
  userId,
  onSubmit,
  groupId,
}: TrackTableProps) => {
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({})
  const [loadingState, setLoadingState] = useState<Record<string, boolean>>({})
  const [visibleRecords, setVisibleRecords] = useState(20) // State to track visible records

  // Calculate the number of problems each leetcoder has solved
  const leetcoderSolvedCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    leetcoders.forEach((leetcoder) => {
      counts[leetcoder.id] = tableData.reduce((acc, row) => {
        const hasSolved = row.userSubmissions.some((sub) => sub.user_id === leetcoder.id)
        return acc + (hasSolved ? 1 : 0)
      }, 0)
    })

    return counts
  }, [tableData, leetcoders])

  // Sort leetcoders by the number of problems solved (descending order)
  const sortedLeetcoders = useMemo(() => {
    return [...leetcoders].sort((a, b) => {
      return leetcoderSolvedCounts[b.id] - leetcoderSolvedCounts[a.id]
    })
  }, [leetcoders, leetcoderSolvedCounts])

  // Slice the tableData to only show the first `visibleRecords` items
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

  // Helper function to parse dates in DD/MM/YYYY format

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
                'whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium'
              )}
            >
              {info.getValue()}
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
                'w-fit rounded-lg px-2 py-1 text-xs font-medium capitalize',
                getDifficultyColor(difficulty)
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
                <span className="flex-1 text-right text-xs font-medium">{totalSolved}</span>
                <CountChart
                  totalSolved={totalSolved}
                  total={total}
                />
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
              <LeetcoderCard
                leetcoderId={leetcoder.id}
                leetcoderUser={leetcoder.username}
                currentUser={userId === leetcoder.id}
              />
            ),
            cell: (info) => {
              const problemId = info.row.original.problem.id
              const key = `${leetcoder.id}-${problemId}`
              const isDisabled =
                userId !== leetcoder.id ||
                Boolean(info.getValue()) ||
                loadingState[key] ||
                checkedState[key]
              const isChecked = checkedState[key] || Boolean(info.getValue())

              const handleCheck = async () => {
                if (isDisabled) return

                setLoadingState((prev) => ({ ...prev, [key]: true }))
                setCheckedState((prev) => ({ ...prev, [key]: true }))

                try {
                  const success = await onSubmit({
                    user_id: leetcoder.id,
                    lc_username: leetcoder.lc_username,
                    problem_slug: info.row.original.problem.problem_slug,
                    problem_id: problemId,
                    group_no: groupId,
                  })

                  if (!success) {
                    setCheckedState((prev) => ({ ...prev, [key]: false }))
                  }
                } catch {
                  setCheckedState((prev) => ({ ...prev, [key]: false }))
                } finally {
                  setLoadingState((prev) => ({ ...prev, [key]: false }))
                }
              }

              return (
                <div className="flex items-center">
                  <Checkbox
                    checked={isChecked}
                    disabled={isDisabled}
                    onCheckedChange={handleCheck}
                    className={cn(
                      'rounded-[.3rem] disabled:opacity-100 dark:data-[state=checked]:bg-[#2383E2]'
                    )}
                  />
                </div>
              )
            },
          }
        )
      ),
    ],
    [sortedLeetcoders, leetcoders.length, loadingState, checkedState, userId, onSubmit, groupId]
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
                className="flex w-full items-center justify-center whitespace-nowrap py-2 text-xs text-gray-500"
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
