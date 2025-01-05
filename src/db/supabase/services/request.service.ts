// 'use server'
//
// import { createClient } from '@/db/supabase/server'
//
// export const insertRequest = async (
//   request: Omit<RequestInsert, 'id' | 'created_at'>
// ): Promise<RequestRow> => {
//   try {
//     const supabase = await createClient()
//
//     const { data, error } = await supabase
//       .from('requests')
//       .insert([request])
//       .select()
//       .single()
//
//     if (error) throw error
//
//     return data as RequestRow
//   } catch (error) {
//     console.error('insertRequest error:', error)
//     throw error
//   }
// }
//
// export const acceptRequest = async (id: string): Promise<RequestRow> => {
//   try {
//     const supabase = await createClient()
//
//     const { data, error } = await supabase
//       .from('requests')
//       .update({ status: 'approved' })
//       .eq('id', id)
//       .select()
//       .single()
//
//     if (error) throw error
//
//     return data as RequestRow
//   } catch (error) {
//     console.error('acceptRequest error:', error)
//     throw error
//   }
// }
//
// export const rejectRequest = async (id: string): Promise<RequestRow> => {
//   try {
//     const supabase = await createClient()
//
//     const { data, error } = await supabase
//       .from('requests')
//       .update({ status: 'rejected' })
//       .eq('id', id)
//       .select()
//       .single()
//
//     if (error) throw error
//
//     return data as RequestRow
//   } catch (error) {
//     console.error('rejectRequest error:', error)
//     throw error
//   }
// }
//
// export const fetchRequests = async (): Promise<RequestRow[]> => {
//   try {
//     const supabase = await createClient()
//
//     const { data, error } = await supabase.from('requests').select('*')
//
//     if (error) throw error
//
//     return data as RequestRow[]
//   } catch (error) {
//     console.error('fetchRequests error:', error)
//     throw error
//   }
// }
