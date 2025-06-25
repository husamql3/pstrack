'use client'

import type { leetcoders } from '@prisma/client'
import { createColumnHelper, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { Calendar, Hash, Puzzle, Tag, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FaTrophy } from 'react-icons/fa6'
// import { toast } from 'sonner'
// import { infoToastStyle } from '@/app/_components/toast-styles'
import { LargeScreenTable } from '@/app/group/_components/large-screen-table'
import { LeetCoderCard } from '@/app/group/_components/leetcoder-card'
import { SmallScreenTable } from '@/app/group/_components/small-screen-table'
import { SubmitCheckbox } from '@/app/group/_components/submit-checkbox'
import { PROBLEM_BASE_URL, VISIBLE_COUNT } from '@/data/constants'
import { useScreenSize } from '@/hooks/use-screen-size'
import { useSubmissionStore } from '@/stores/submissionStore'
import type { Difficulty, Topic } from '@/types/problems.type'
import type { TableRowOutput } from '@/types/tableRow.type'
import { cn } from '@/utils/cn'
import { parseDate } from '@/utils/parseDate'
import { getDifficultyColor } from '@/utils/problemsUtils'

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
  const { submissions } = useSubmissionStore()
  const [currentVisibleCount, setCurrentVisibleCount] = useState(VISIBLE_COUNT)
  const isLargeScreen = useScreenSize()

  // useEffect(() => {
  //   toast.info(
  //     'We currently do not have any new problems. We are pausing our progress until the exam period is over.',
  //     { style: infoToastStyle, duration: 5000, closeButton: true }
  //   )
  // }, [])

  const leetcoderSolvedCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {}
    const userSolvedProblems: Record<string, Set<string>> = {}

    // Initialize counters and problem sets for each user
    for (const leetcoder of leetcoders) {
      counts[leetcoder.id] = 0
      userSolvedProblems[leetcoder.id] = new Set()
    }

    // Count submissions from tableData (API data) - use all tableData, not just visible
    for (const row of tableData) {
      for (const submission of row.userSubmissions) {
        if (userSolvedProblems[submission.user_id] !== undefined) {
          userSolvedProblems[submission.user_id].add(row.problem.id)
        }
      }
    }

    // Count submissions from local store
    for (const key in submissions) {
      const submission = submissions[key]
      // Handle backward compatibility - check if it's boolean or object
      const isSolved = typeof submission === 'boolean' ? submission : submission?.solved
      if (isSolved) {
        const [keyGroupId, userId, problemId] = key.split(':')
        if (keyGroupId === groupId && userSolvedProblems[userId] !== undefined) {
          // Only add if not already in the set (avoids double counting)
          if (!userSolvedProblems[userId].has(problemId)) {
            userSolvedProblems[userId].add(problemId)
          }
        }
      }
    }

    // Convert sets to counts
    for (const leetcoder of leetcoders) {
      counts[leetcoder.id] = userSolvedProblems[leetcoder.id].size
    }

    return counts
  }, [leetcoders, tableData, submissions, groupId])

  const sortedLeetcoders = useMemo(() => {
    const sorted = [...leetcoders].sort((a, b) => {
      const countA = leetcoderSolvedCounts[a.id] || 0
      const countB = leetcoderSolvedCounts[b.id] || 0
      const countDiff = countB - countA

      // If submission counts are different, sort by count (descending)
      if (countDiff !== 0) {
        return countDiff
      }

      // If counts are equal, sort by earliest submission time (ascending - who solved first)
      // Get all submissions for user A from tableData
      const userASubmissions = tableData
        .filter((row) => row.userSubmissions.some((sub) => sub.user_id === a.id))
        .flatMap((row) => row.userSubmissions.filter((sub) => sub.user_id === a.id))

      // Get all submissions for user B from tableData
      const userBSubmissions = tableData
        .filter((row) => row.userSubmissions.some((sub) => sub.user_id === b.id))
        .flatMap((row) => row.userSubmissions.filter((sub) => sub.user_id === b.id))

      // If one user has no submissions from API, they go last
      if (userASubmissions.length === 0 && userBSubmissions.length === 0) {
        // Final fallback: sort by username for consistency
        return a.lc_username.localeCompare(b.lc_username)
      }
      if (userASubmissions.length === 0) {
        return 1
      }
      if (userBSubmissions.length === 0) {
        return -1
      }

      // Find earliest submission for each user
      const earliestA = userASubmissions.reduce((earliest, current) => {
        return new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
      })
      const earliestB = userBSubmissions.reduce((earliest, current) => {
        return new Date(current.created_at) < new Date(earliest.created_at) ? current : earliest
      })

      const timeDiff = new Date(earliestA.created_at).getTime() - new Date(earliestB.created_at).getTime()

      // If times are very close (within 1 second), use username as final tiebreaker
      if (Math.abs(timeDiff) < 1000) {
        return a.lc_username.localeCompare(b.lc_username)
      }

      // Sort by earliest submission time (ascending - earlier submissions first)
      return timeDiff
    })

    return sorted
  }, [leetcoders, leetcoderSolvedCounts, tableData, submissions, groupId])

  const visibleTableData = useMemo(() => {
    const sortedData = [...tableData].sort((a, b) => {
      const dateA = parseDate(a.groupProgressDate || '')
      const dateB = parseDate(b.groupProgressDate || '')
      return dateB.getTime() - dateA.getTime()
    })

    return sortedData.slice(0, currentVisibleCount)
  }, [tableData, currentVisibleCount])

  const handleShowMore = () => {
    setCurrentVisibleCount((prev) => Math.min(prev + VISIBLE_COUNT, tableData.length))
  }

  const hasMoreToShow = currentVisibleCount < tableData.length

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
            <Hash className="size-4 text-indigo-400" />
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
                className={cn(
                  'group flex h-7 items-center justify-center gap-2 rounded-lg border px-2 font-semibold transition-all duration-200 hover:text-blue-300',
                  'border border-indigo-500/30 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-400'
                )}
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
            <Tag className="size-4 text-blue-400" />
            Topic
          </div>
        ),
        cell: (info) => {
          const topic = info.getValue() as Topic
          return (
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400',
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
            <div className="flex items-center gap-2 pr-5 pl-3 font-semibold text-zinc-100">
              <Target className="size-4 text-neutral-400" />
              Progress
            </div>
          ),
          cell: (info) => {
            const { totalSolved, total } = info.getValue()
            const percentage = (totalSolved / total) * 100
            return (
              <div className="mx-auto flex h-8 items-center pr-5 pl-3">
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
                  />
                </div>
              )
            },
          }
        )
      ),
    ],
    [sortedLeetcoders, groupId, submissions, leetcoders.length]
  )

  const table = useReactTable({
    data: visibleTableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLargeScreen === null) {
    return null
  }

  const tableProps = {
    table,
    sortedLeetcoders,
    leetcoderSolvedCounts,
    hasMoreToShow,
    handleShowMore,
  }

  return (
    <div className="w-full px-3 py-8">
      {/* Table Container - Conditionally render only the appropriate component */}
      <div className="overflow-x-auto rounded-lg border border-zinc-800 shadow-2xl backdrop-blur-sm">
        {isLargeScreen ? <LargeScreenTable {...tableProps} /> : <SmallScreenTable {...tableProps} />}
      </div>
    </div>
  )
}
