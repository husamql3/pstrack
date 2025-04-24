import { createSearchParamsCache, createSerializer, parseAsString } from 'nuqs/server'

export const searchParams = {
  leetcoderStatus: parseAsString.withDefault(''),
  groupNo: parseAsString.withDefault(''),
  leetcoderEmail: parseAsString.withDefault(''),
}

export const searchParamsCache = createSearchParamsCache(searchParams)
export const serialize = createSerializer(searchParams)
