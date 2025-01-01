import { toNextJsHandler } from 'better-auth/next-js'

import { auth } from '@/db/better-auth/server'

export const config = { api: { bodyParser: false } }

export const { GET, POST } = toNextJsHandler(auth.handler)
