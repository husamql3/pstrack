export const sanitizeUsername = (raw: string): string =>
	raw
		.toLowerCase()
		.replace(/[^a-z0-9_-]/g, "")
		.slice(0, 30)

export const deriveInitialUsername = (
	name?: string | null,
	email?: string | null
): string => {
	if (name) return sanitizeUsername(name.replace(/\s+/g, ""))
	if (email) return sanitizeUsername(email.split("@")[0])
	return ""
}
