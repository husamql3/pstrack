import { Database } from '@/db/supabase/supabase'

// leetcoders
type LeetcoderRow = Database['public']['Tables']['leetcoders']['Row']
type LeetcoerInsert = Database['public']['Tables']['leetcoders']['Insert']

// requests
type RequestRow = Database['public']['Tables']['requests']['Row']
type RequestInsert = Database['public']['Tables']['requests']['Insert']

export type { LeetcoderRow, LeetcoerInsert, RequestRow, RequestInsert }
