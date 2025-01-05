import { createClient } from '@/db/supabase/server'
import { SubmissionRow } from '@/types/supabase.type'

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
