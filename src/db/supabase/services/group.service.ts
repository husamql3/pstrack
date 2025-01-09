import { createClient } from '@/db/supabase/server'

export const checkGroupExists = async (id: number): Promise<boolean> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('group_no', id)
      .single()

    if (error) return false

    return !!data
  } catch (error) {
    console.error('catch fetchGroups error:', error)
    return false
  }
}
