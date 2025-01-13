import { leetcoders } from '@prisma/client'
import { TableData } from '@/types/tableRow.type'

export type TrackViewProps = {
  tableData: TableData
  leetcoders: leetcoders[]
  userId?: string
  groupId: number
}
