export const errorDescription = (err: unknown) =>
	err instanceof Error ? err.message : "Please try again."

export const formatDate = (d: Date | string | null) => {
	if (!d) return null
	const date = typeof d === "string" ? new Date(d) : d
	return date.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

export const providerLabel = (providerId: string): string => {
	if (providerId === "google") return "Google"
	if (providerId === "github") return "GitHub"
	if (providerId === "magic-link") return "Magic link"
	if (providerId === "credential") return "Email & password"
	return providerId
}
