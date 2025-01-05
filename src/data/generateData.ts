import { GroupProgressRow, RoadmapRow, SubmissionRow } from '@/types/supabase.type'

export type TableRow = {
  group_no: number
  roadmap: RoadmapRow[]
  submission: SubmissionRow[]
  group_progress: GroupProgressRow[]
}

export type TableData = {
  problemOrder: number // problem_order from roadmap
  problem: RoadmapRow // The entire roadmap row
  totalSolved: number // Number of solved submissions
  userSubmissions: SubmissionRow[] // Array of submissions for the problem
  groupProgressDate: string | null // Formatted date (MM/DD) or null
}[]

export const generateData = ({
  group_no,
  roadmap,
  submission,
  group_progress,
}: TableRow): TableData => {
  // Find the group progress entry for the group (assuming group_no is 1)
  const groupProgress = group_progress.find((progress) => progress.group_no === group_no)

  // Format the created_at date to MM/DD format
  const formattedDate = groupProgress
    ? new Date(groupProgress.created_at).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
      })
    : null

  return roadmap.map((problem) => {
    const problemSubmissions = submission.filter(
      (submission) => submission.problem_id === problem.id
    )

    return {
      problemOrder: problem.problem_order,
      problem: problem,
      totalSolved: problemSubmissions.filter((submission) => submission.solved).length,
      userSubmissions: problemSubmissions,
      groupProgressDate: formattedDate,
    }
  })
}
