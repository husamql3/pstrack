import { createClient } from '@/db/supabase/server'
import { LeetCoder } from '@/types/table.type'

export const getLeetcoders = async (): Promise<LeetCoder[] | undefined> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('leetcoders').select('*')

    if (error) {
      console.error('getLeetcoders error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('catch getLeetcoders error:', error)
  }
}

export const getLeetcoder = async (
  id: string
): Promise<LeetCoder | undefined> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leetcoders')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('getLeetcoder error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('catch getLeetcoder error:', error)
  }
}
