import { polarClient } from "@polar-sh/better-auth"
import { adminClient, magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_BASE_URL ?? "http://localhost:3000",
	plugins: [magicLinkClient(), adminClient(), polarClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
