export const CACHE_KEYS = {
	group: (id: string) => `group:${id}`,
	groups: () => `groups:all`,
	userGroups: (userId: string) => `userGroups:${userId}`,
	problem: (id: string) => `problem:${id}`,
	problems: () => `problems:all`,
} as const;

export const CACHE_TTL = {
	group: 60 * 60 * 24, // 24 hours
	groups: 60 * 60 * 24, // 24 hours
	userGroups: 60 * 60 * 24, // 24 hours
	problem: 60 * 60 * 24, // 24 hours
	problems: 60 * 60 * 24, // 24 hours
} as const;
