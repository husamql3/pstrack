import { polarClient } from "@polar-sh/better-auth"
import {
	adminClient,
	inferAdditionalFields,
	magicLinkClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { env } from "@/env"
import type { Auth } from "@/server/lib/auth"

export const authClient = createAuthClient({
	baseURL: env.VITE_BASE_URL,
	basePath: "/api/v4/auth",
	plugins: [
		magicLinkClient(),
		adminClient(),
		polarClient(),
		inferAdditionalFields<Auth>(),
	],
})

export const { signIn, signOut, signUp, useSession } = authClient
