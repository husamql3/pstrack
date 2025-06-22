import type { TableData, TableRow } from '@/types/tableRow.type'

export const generateTableData = (groupData: TableRow): TableData => {
  const { roadmap, submission, group_progress } = groupData

  return roadmap.map((problem) => {
    const problemSubmissions = submission.filter((submission) => submission.problem_id === problem.id)

    const uniqueUserIds = new Set(problemSubmissions.map((submission) => submission.user_id))

    // Find the group_progress record for this problem
    const progressForProblem = group_progress.find((gp) => gp.current_problem === problem.problem_order)

    // Format the created_at date for this problem's progress
    const formattedDate = progressForProblem
      ? new Date(progressForProblem.created_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null

    return {
      problemOrder: problem.problem_order,
      problem: problem,
      totalSolved: problemSubmissions.filter((submission) => submission.solved).length,
      totalSubmissions: uniqueUserIds.size,
      userSubmissions: problemSubmissions,
      groupProgressDate: formattedDate,
    }
  })
}
