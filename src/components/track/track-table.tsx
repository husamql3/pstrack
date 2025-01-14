import { useMemo, useState } from 'react'
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
  tableData,
  leetcoders,
  userId,
  onSubmit,
  groupId,
}: TrackTableProps) => {
  const [submittingCheckboxId, setSubmittingCheckboxId] = useState<string | null>(null)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({})

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
        (row) => ({ totalSolved: row.totalSolved, total: leetcoders.length }),
        {
          id: 'count',
          header: () => 'Count',
          cell: (info) => {
            const { totalSolved, total } = info.getValue()
            return (
              <div className="flex items-baseline space-x-0.5">
                <span className="text-base font-medium">{totalSolved}</span>
                <span className="text-gray-500">/{total}</span>
              </div>
            )
          },
        }
      ),
      // Use the sortedLeetcoders array instead of the original leetcoders array
      ...sortedLeetcoders.map((leetcoder) =>
        columnHelper.accessor(
          (row) =>
            row.userSubmissions.find((sub) => sub.user_id === leetcoder.id) || false,
          {
            id: leetcoder.id,
            header: () => <span>@{leetcoder.username.toLowerCase()}</span>,
            cell: (info) => {
              const isCurrentCheckboxSubmitting = submittingCheckboxId === leetcoder.id
              const isCheckedOptimistically =
                optimisticUpdates[`${leetcoder.id}-${info.row.original.problem.id}`]

              const onCheck = async () => {
                setSubmittingCheckboxId(leetcoder.id)

                setOptimisticUpdates((prev) => ({
                  ...prev,
                  [`${leetcoder.id}-${info.row.original.problem.id}`]: true,
                }))

                try {
                  const success = await onSubmit({
                    user_id: leetcoder.id,
                    lc_username: leetcoder.lc_username,
                    problem_slug: info.row.original.problem.problem_slug,
                    problem_id: info.row.original.problem.id,
                    group_no: groupId,
                  })

                  if (!success) {
                    setOptimisticUpdates((prev) => ({
                      ...prev,
                      [`${leetcoder.id}-${info.row.original.problem.id}`]: false,
                    }))
                  }
                } catch {
                  setOptimisticUpdates((prev) => ({
                    ...prev,
                    [`${leetcoder.id}-${info.row.original.problem.id}`]: false,
                  }))
                } finally {
                  setSubmittingCheckboxId(null)
                }
              }

              const isChecked = Boolean(info.getValue()) || isCheckedOptimistically

              return (
                <div className="flex items-center">
                  <Checkbox
                    checked={isChecked}
                    disabled={
                      userId !== leetcoder.id ||
                      Boolean(info.getValue()) ||
                      isCurrentCheckboxSubmitting
                    }
                    onCheckedChange={onCheck}
                  />
                </div>
              )
            },
          }
        )
      ),
    ],
    [
      sortedLeetcoders,
      leetcoders.length,
      submittingCheckboxId,
      optimisticUpdates,
      userId,
      onSubmit,
      groupId,
    ]
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
        <TableFooter className="border-zinc-700 text-xs font-medium">
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-right text-xs font-medium text-gray-500"
            >
              Total
            </TableCell>

            {sortedLeetcoders.map((leetcoder) => (
              <TableCell
                key={leetcoder.id}
                className="text-center"
              >
                {leetcoderSolvedCounts[leetcoder.id]}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
