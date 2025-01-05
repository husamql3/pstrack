import { group_progres, roadmap, submission } from '@/data/dummy'

export const generateData = () => {
  // Find the group progress entry for the group (assuming group_no is 1)
  const groupProgress = group_progres.find((progress) => progress.group_no === 1)

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
