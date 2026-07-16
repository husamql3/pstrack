import { queryOptions } from "@tanstack/react-query"
import { createIsomorphicFn } from "@tanstack/react-start"

import { authClient } from "@/lib/auth-client"

const fetchSession = createIsomorphicFn()
	.client(async () => {
		const { data } = await authClient.getSession()
		return data
	})
	.server(async () => {
		const { auth } = await import("@/server/lib/auth")
		const { getRequestHeaders } = await import("@tanstack/react-start/server")
		return await auth.api.getSession({ headers: getRequestHeaders() })
	})

export const SESSION_QUERY_KEY = ["session"] as const

// The root route's beforeLoad reads the session through this query on every
// navigation. staleTime keeps repeat navigations off the network — the server
// still authorizes every API call, so a briefly stale guard is safe. Anything
// that changes the session (logout, onboarding profile save, Pro purchase)
// must remove/invalidate SESSION_QUERY_KEY so the next guard check refetches.
export const sessionQueryOptions = queryOptions({
	queryKey: SESSION_QUERY_KEY,
	queryFn: () => fetchSession(),
	staleTime: 1000 * 60 * 5,
})
