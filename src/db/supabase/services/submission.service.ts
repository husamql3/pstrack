import { createClient } from '@/db/supabase/server'
import { SubmissionInsert, SubmissionRow } from '@/types/supabase.type'

export const fetchGroupSubmissions = async (
  group_no: number
): Promise<SubmissionRow[]> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('submission')
      .select('*')
      .eq('group_no', group_no)

    if (error) {
      console.error('fetchGroupSubmissions error:', error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error('catch fetchGroupSubmissions error:', error)
    return []
  }
}

export const insertCheckSubmission = async (
  submission: SubmissionInsert
): Promise<SubmissionRow> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('submission')
      .insert([
        {
          user_id: submission.user_id,
          problem_id: submission.problem_id,
          group_no: submission.group_no,
          solved: true,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return data as SubmissionRow
  } catch (error) {
    console.error('catch insertSubmission error:', error)
    throw error
  }
}
