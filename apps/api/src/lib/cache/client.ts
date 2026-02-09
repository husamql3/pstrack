import { Redis } from "@upstash/redis";

import { env } from "@/env";

export const redis = new Redis({
	url: env.UPSTASH_REDIS_URL,
	token: env.UPSTASH_REDIS_TOKEN,
});

export const REALTIME_CONFIG = {
	// Message TTL in seconds (keep messages for 24 hours)
	MESSAGE_TTL: 86400,

	// Max messages per channel
	MAX_MESSAGES: 100,

	// Presence timeout (5 minutes)
	PRESENCE_TIMEOUT: 300,
} as const;
