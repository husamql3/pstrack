import { Redis } from "@upstash/redis"

import { env } from "@/env"

const REDIS_KEY_PREFIX = "pstrack"

let redisClient: Redis | null = null

export type RedisSetOptions = {
	ttlSeconds?: number
}

export const createRedisKey = (...parts: Array<number | string>) =>
	[REDIS_KEY_PREFIX, ...parts.map((part) => String(part).trim()).filter(Boolean)].join(
		":"
	)

export const getRedis = () => {
	if (redisClient) return redisClient

	if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
		throw new Error("Upstash Redis is not configured")
	}

	redisClient = new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	})

	return redisClient
}

export const redisGet = async <TValue>(key: string): Promise<TValue | null> => {
	return getRedis().get<TValue>(key)
}

export const redisSet = async <TValue>(
	key: string,
	value: TValue,
	options: RedisSetOptions = {}
) => {
	const { ttlSeconds } = options

	if (ttlSeconds) {
		return getRedis().set(key, value, { ex: ttlSeconds })
	}

	return getRedis().set(key, value)
}

export const redisDel = async (...keys: string[]) => {
	if (keys.length === 0) return 0

	return getRedis().del(...keys)
}

export const redisSAdd = async (key: string, ...members: string[]) => {
	if (members.length === 0) return 0

	return getRedis().sadd(key, members[0], ...members.slice(1))
}

export const redisSIsMember = async (key: string, member: string): Promise<boolean> => {
	return (await getRedis().sismember(key, member)) === 1
}

export const redisExpire = async (key: string, ttlSeconds: number) => {
	return getRedis().expire(key, ttlSeconds)
}
