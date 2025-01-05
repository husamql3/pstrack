import { createClient } from '@/db/supabase/server'
import { LeetcoderInsert, LeetcoderRow } from '@/types/supabase.type'

export const insertLeetcoder = async (
  request: Omit<LeetcoderInsert, 'id' | 'created_at'>
): Promise<LeetcoderRow> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('leetcoders').insert([request]).select().single()

    if (error) {
      if (error.code === '23505') throw new Error('You are already registered.')
      else throw error
    }

    return data as LeetcoderRow
  } catch (error) {
    console.error('catch insertLeetcoder error:', error)
    throw error
  }
}

export const fetchPendingLeetcoders = async (): Promise<LeetcoderRow[] | undefined> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('leetcoders').select('*').eq('status', 'pending')

    if (error) {
      console.error('fetchPendingLeetcoders error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('catch fetchPendingLeetcoders error:', error)
  }
}

export const approveLeetcoder = async (id: string): Promise<LeetcoderRow> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('leetcoders')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('approveLeetcoder error:', error)
      throw error
    }

    return data as LeetcoderRow
  } catch (error) {
    console.error('catch approveLeetcoder error:', error)
    throw error
  }
}
