import { GroupProgressRow } from '@/types/supabase.type'
import { createClient } from '@/db/supabase/server'

export const fetchGroupProgress = async (
  group_no: number
): Promise<GroupProgressRow[]> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('group_progress')
      .select('*')
      .eq('group_no', group_no)

    if (error) {
      console.error('fetchGroupProgress error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('catch fetchGroupProgress error:', error)
    return []
  }
}
