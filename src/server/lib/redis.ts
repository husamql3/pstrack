import type { RedisClient } from "bun"

import { env } from "@/env"

const REDIS_KEY_PREFIX = "pstrack"

// Bounded so commands against a dead Redis fail fast and observably instead of
// queueing forever; the offline queue only bridges the reconnect retry window.
const CONNECTION_TIMEOUT_MS = 5_000
const MAX_RECONNECT_ATTEMPTS = 5

let clientPromise: Promise<RedisClient> | null = null
let shutdownHookRegistered = false

export type RedisSetOptions = {
	ttlSeconds?: number
}

export const createRedisKey = (...parts: Array<number | string>) =>
	[REDIS_KEY_PREFIX, ...parts.map((part) => String(part).trim()).filter(Boolean)].join(
		":"
	)

// The "bun" module is imported lazily: this file must stay importable under
// Node-based tooling (Vitest, the Vercel staging runtime) where Redis is
// intentionally not configured. Redis-backed features require the Bun runtime
// (ADR 0011) and a REDIS_URL.
const createClient = async (): Promise<RedisClient> => {
	if (!env.REDIS_URL) {
		throw new Error("Redis is not configured (REDIS_URL is unset)")
	}

	const { RedisClient } = await import("bun")

	const client = new RedisClient(env.REDIS_URL, {
		connectionTimeout: CONNECTION_TIMEOUT_MS,
		autoReconnect: true,
		maxRetries: MAX_RECONNECT_ATTEMPTS,
		enableOfflineQueue: true,
	})

	client.onclose = (error) => {
		console.error("[redis] connection closed", error)
	}

	if (!shutdownHookRegistered) {
		shutdownHookRegistered = true
		process.once("SIGTERM", () => {
			closeRedis().catch(() => {})
		})
	}

	return client
}

export const getRedis = (): Promise<RedisClient> => {
	clientPromise ??= createClient().catch((error) => {
		clientPromise = null
		throw error
	})

	return clientPromise
}

export const closeRedis = async () => {
	if (!clientPromise) return

	const pending = clientPromise
	clientPromise = null

	const client = await pending.catch(() => null)
	if (!client) return

	// Intentional shutdown - silence the error-level disconnect log.
	client.onclose = () => {}
	client.close()
}

export const redisGet = async <TValue>(key: string): Promise<TValue | null> => {
	const client = await getRedis()
	const raw = await client.get(key)

	if (raw === null) return null

	return JSON.parse(raw)
}

export const redisSet = async <TValue>(
	key: string,
	value: TValue,
	options: RedisSetOptions = {}
) => {
	const client = await getRedis()
	const payload = JSON.stringify(value)
	const { ttlSeconds } = options

	if (ttlSeconds) {
		return client.set(key, payload, "EX", ttlSeconds)
	}

	return client.set(key, payload)
}

export const redisDel = async (...keys: string[]) => {
	if (keys.length === 0) return 0

	const client = await getRedis()
	return client.del(...keys)
}

export const redisSAdd = async (key: string, ...members: string[]) => {
	if (members.length === 0) return 0

	const client = await getRedis()
	return client.sadd(key, ...members)
}

export const redisSIsMember = async (key: string, member: string): Promise<boolean> => {
	const client = await getRedis()
	return client.sismember(key, member)
}

export const redisExpire = async (key: string, ttlSeconds: number) => {
	const client = await getRedis()
	return client.expire(key, ttlSeconds)
}
