import { createCallerFactory, createTRPCRouter } from '@/server/trpc'
import { authRouter } from '@/server/routers/auth'
import { leetcodersRouter } from '@/server/routers/leetcoder'
import { groupsRouter } from '@/server/routers/groups'
import { roadmapRouter } from '@/server/routers/roadmap'
import { submissionsRouter } from '@/server/routers/submissions'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  auth: authRouter,
  leetcoders: leetcodersRouter,
  groups: groupsRouter,
  roadmap: roadmapRouter,
  submissions: submissionsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
