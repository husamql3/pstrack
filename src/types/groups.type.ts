import type { groups, leetcoders } from '@prisma/client'

export type GetAllAvailableGroupsType = groups & {
  leetcoders: Pick<leetcoders, 'id'>[]
}
