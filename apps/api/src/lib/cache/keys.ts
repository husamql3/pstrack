export const CACHE_KEYS = {
	group: (id: string) => `group:${id}`,
	groups: () => `groups:all`,
	userGroups: (userId: string) => `userGroups:${userId}`,
} as const;

export const CACHE_TTL = {
	group: 60 * 60 * 24, // 24 hours
	groups: 60 * 60 * 24, // 24 hours
	userGroups: 60 * 60 * 24, // 24 hours
} as const;
