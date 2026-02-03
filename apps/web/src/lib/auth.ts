import { createAuthClient } from "better-auth/react";

export const auth = createAuthClient({
	baseURL: "http://localhost:8787/api/v3/auth",
	// credentials: "include",
});
