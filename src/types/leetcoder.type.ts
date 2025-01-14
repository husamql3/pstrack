import { leetcoders } from '@prisma/client'

export type LeetcoderRequest = Omit<leetcoders, 'created_at' | 'status' | 'id'>

export type Leetcoders = {
  id: string
  name: string
  email: string
  username: string
  lc_username: string
  gh_username: string | null
  group_no: number
  status: string
  created_at: string | null
}
