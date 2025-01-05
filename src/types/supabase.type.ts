import { Database } from '@/types/supabase'

// leetcoders
export type LeetcoderRow = Database['public']['Tables']['leetcoders']['Row']
export type LeetcoderInsert = Database['public']['Tables']['leetcoders']['Insert']
export type LeetcodeRowType = LeetcoderRow[] | undefined

// groups
export type GroupRow = Database['public']['Tables']['groups']['Row']
export type GroupInsert = Database['public']['Tables']['groups']['Insert']

// roadmap
export type RoadmapRow = Database['public']['Tables']['roadmap']['Row']
export type RoadmapInsert = Database['public']['Tables']['roadmap']['Insert']

// submission
export type SubmissionRow = Database['public']['Tables']['submission']['Row']
export type SubmissionInsert = Database['public']['Tables']['submission']['Insert']

// group_progress
export type GroupProgressRow = Database['public']['Tables']['group_progress']['Row']
export type GroupProgressInsert = Database['public']['Tables']['group_progress']['Insert']
