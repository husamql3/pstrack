'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { FaTrophy } from 'react-icons/fa6'
import { Target, Calendar, Hash, Tag, Puzzle } from 'lucide-react'
import type { leetcoders } from '@prisma/client'
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import { PROBLEM_BASE_URL, VISIBLE_COUNT } from '@/data/constants'
import type { TableRowOutput } from '@/types/tableRow.type'
import type { Difficulty, Topic } from '@/types/problems.type'
import { parseDate } from '@/utils/parseDate'
import { cn } from '@/utils/cn'
import { useSubmissionStore } from '@/stores/submissionStore'
import { getDifficultyColor, getTopicColor } from '@/utils/problemsUtils'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table'
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
  const [refreshKey, setRefreshKey] = useState(0)

  const { submissions } = useSubmissionStore()

  useEffect(() => {
    setRefreshKey((prev) => prev + 1)
  }, [submissions])

  const leetcoderSolvedCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}

    for (const leetcoder of leetcoders) {
      counts[leetcoder.id] = 0
    }

    for (const row of tableData) {
      for (const submission of row.userSubmissions) {
        if (counts[submission.user_id] !== undefined) {
          counts[submission.user_id]++
        }
      }
    }

    for (const key in submissions) {
      if (submissions[key]) {
        const [keyGroupId, userId, problemId] = key.split(':')
        if (keyGroupId === groupId && counts[userId] !== undefined) {
          const alreadyCounted = tableData.some(
            (row) => row.problem.id === problemId && row.userSubmissions.some((sub) => sub.user_id === userId)
          )

          if (!alreadyCounted) {
            counts[userId]++
          }
        }
      }
    }

    return counts
  }, [leetcoders, tableData, submissions, groupId, refreshKey])

  const sortedLeetcoders = useMemo(() => {
    return [...leetcoders].sort((a, b) => {
      return leetcoderSolvedCounts[b.id] - leetcoderSolvedCounts[a.id]
    })
  }, [leetcoders, leetcoderSolvedCounts])

  const handleSuccessfulSubmit = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  const visibleTableData = useMemo(() => {
    const sortedData = [...tableData].sort((a, b) => {
      const dateA = parseDate(a.groupProgressDate || '')
      const dateB = parseDate(b.groupProgressDate || '')
      return dateB.getTime() - dateA.getTime()
    })

    return sortedData.slice(0, VISIBLE_COUNT)
  }, [tableData])

  const columns = useMemo(
    () => [
      columnHelper.accessor('groupProgressDate', {
        header: () => (
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
            <Calendar className="size-4 text-zinc-100" />
            Date
          </div>
        ),
        cell: (info) => (
          <div className="flex h-8 items-center justify-center rounded-lg border border-zinc-800 px-2 font-mono text-xs text-slate-300">
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('problem', {
        header: () => (
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
            <Hash className="size-4 text-blue-400" />
            Problem
          </div>
        ),
        cell: (info) => {
          const problem = info.getValue()
          return (
            <div className="flex items-center justify-center">
              <a
                href={`${PROBLEM_BASE_URL}/${problem.problem_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open problem in a new tab"
                className="group flex h-7 items-center justify-center gap-2 rounded-lg border bg-gradient-to-r from-blue-500/20 to-cyan-500/20 px-2 font-semibold text-blue-400 transition-all duration-200 hover:text-blue-300"
              >
                #{problem.problem_no}
              </a>
            </div>
          )
        },
      }),
      columnHelper.accessor('problem.topic', {
        header: () => (
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
            <Tag className="size-4 text-blue-700" />
            Topic
          </div>
        ),
        cell: (info) => {
          const topic = info.getValue() as Topic
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  getTopicColor(topic),
                  'flex h-7 items-center justify-center rounded-lg border px-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 hover:scale-105'
                )}
              >
                {topic}
              </div>
            </div>
          )
        },
      }),
      columnHelper.accessor('problem.difficulty', {
        header: () => (
          <div className="flex items-center justify-center gap-2 font-semibold text-slate-300">
            <Puzzle className="size-4 text-zinc-300" />
            Difficulty
          </div>
        ),
        cell: (info) => {
          const difficulty = info.getValue() as Difficulty
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  getDifficultyColor(difficulty),
                  'flex h-7 items-center justify-center rounded-lg px-2 text-sm font-semibold transition-all duration-200 hover:scale-105'
                )}
              >
                {difficulty}
              </div>
            </div>
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
          header: () => (
            <div className="flex items-center gap-2 font-semibold text-zinc-100">
              <Target className="size-4 text-neutral-400" />
              Progress
            </div>
          ),
          cell: (info) => {
            const { totalSolved, total } = info.getValue()
            const percentage = (totalSolved / total) * 100
            return (
              <div className="flex h-8 items-center">
                <div className="flex w-full flex-col gap-1">
                  <div className="flex items-center justify-center gap-1 text-xs font-bold text-zinc-200">
                    <span className="text-zinc-100">{totalSolved}</span>
                    <span className="text-neutral-400">/</span>
                    <span className="text-neutral-300">{total}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-zinc-400 to-neutral-200 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          },
        }
      ),
      ...sortedLeetcoders.map((leetcoder, index) =>
        columnHelper.accessor(
          (row) => {
            const apiSubmission = row.userSubmissions.find((sub) => sub.user_id === leetcoder.id)
            const storeKey = `${groupId}:${leetcoder.id}:${row.problem.id}`
            const localSubmission = submissions[storeKey]

            return apiSubmission || localSubmission || false
          },
          {
            id: leetcoder.id,
            header: () => (
              // add extra padding right for the trophy icon
              <div className={cn('relative', index <= 2 && 'pr-4')}>
                <LeetCoderCard
                  leetcoder={leetcoder}
                  className={cn(index <= 2 && 'font-semibold')}
                />
                {index < 3 && (
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 transform">
                    <FaTrophy
                      className={cn(
                        'size-3',
                        index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-amber-600'
                      )}
                    />
                  </div>
                )}
              </div>
            ),
            cell: (info) => {
              const problemSlug = info.row.original.problem.problem_slug
              return (
                <div className="flex h-8 items-center justify-center pr-2">
                  <SubmitCheckbox
                    info={info}
                    leetcoder={leetcoder}
                    groupId={groupId}
                    problemSlug={problemSlug}
                    onSuccessfulSubmit={handleSuccessfulSubmit}
                  />
                </div>
              )
            },
          }
        )
      ),
    ],
    [sortedLeetcoders, leetcoderSolvedCounts, leetcoders.length, groupId, handleSuccessfulSubmit, submissions]
  )

  const table = useReactTable({
    data: visibleTableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="min-h-screen w-full px-3 py-8">
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-zinc-800 shadow-2xl backdrop-blur-sm">
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
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
