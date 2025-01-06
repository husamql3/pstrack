import { LeetcoderRow } from '@/types/supabase.type'
import { TableData } from '@/types/trackTable.type'

export type TrackViewProps = {
  userId: string | undefined
  leetcoders: LeetcoderRow[]
  tableData: TableData
  groupId: number
}
