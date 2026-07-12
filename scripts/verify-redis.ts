#!/usr/bin/env bun
/**
 * Redis behavior verification harness (#288).
 *
 * Exercises the app's Redis helpers under the Bun runtime - the same runtime
 * the production container uses - against a disposable Redis: TTL expiry, set
 * membership, duplicate and concurrent writes, and transparent reconnect after
 * the server kills the connection.
 *
 *   REDIS_URL=redis://127.0.0.1:6379 bun run verify:redis
 *
 * With --unavailable, REDIS_URL must point at a closed port; the harness then
 * asserts the helpers reject in bounded time instead of hanging:
 *
 *   REDIS_URL=redis://127.0.0.1:59321 bun run verify:redis --unavailable
 *
 * With --outage-after-connect, the harness establishes the app connection,
 * stops the disposable Redis with SHUTDOWN, and asserts queued concurrent
 * commands reject within the retry window. Run this mode last because it
 * intentionally stops Redis:
 *
 *   REDIS_URL=redis://127.0.0.1:6379 bun run verify:redis --outage-after-connect
 *
 * Never point it at a Redis holding data you care about: it writes and
 * deletes keys under the pstrack:verify:* namespace.
 */
import { env } from "@/env"
import {
	closeRedis,
	createRedisKey,
	getRedis,
	redisDel,
	redisExpire,
	redisGet,
	redisSAdd,
	redisSet,
	redisSIsMember,
} from "@/server/lib/redis"

const CONCURRENCY = 50
const BOUNDED_FAILURE_LIMIT_MS = 10_000

let failures = 0

const check = (condition: boolean, label: string) => {
	if (condition) {
		console.log(`  ok ${label}`)
	} else {
		failures += 1
		console.error(`  FAIL ${label}`)
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const finish = () => {
	if (failures > 0) {
		console.error(`\n${failures} Redis behavior check(s) failed`)
		process.exit(1)
	}
	console.log("\nAll Redis behavior checks passed")
}

const runUnavailableScenario = async () => {
	console.log("Unavailable Redis fails bounded and observably")
	const startedAt = Date.now()
	const outcome = await redisGet("pstrack:verify:unavailable").then(
		() => null,
		(error: Error) => error.message
	)
	const elapsedMs = Date.now() - startedAt
	check(outcome !== null, `helper rejected (${outcome})`)
	check(
		elapsedMs < BOUNDED_FAILURE_LIMIT_MS,
		`failure bounded at ${elapsedMs}ms (< ${BOUNDED_FAILURE_LIMIT_MS}ms)`
	)
	finish()
}

const runEstablishedOutageScenario = async () => {
	if (!env.REDIS_URL) throw new Error("REDIS_URL is required")

	console.log("Established Redis outage fails queued commands bounded and observably")
	await redisSet("pstrack:verify:outage", "connected")

	const { RedisClient } = await import("bun")
	const controller = new RedisClient(env.REDIS_URL)
	await controller.connect()
	await controller.send("SHUTDOWN", ["NOSAVE"]).catch(() => null)
	controller.close()

	const startedAt = Date.now()
	const outcomes = await Promise.allSettled(
		Array.from({ length: CONCURRENCY }, () => redisGet("pstrack:verify:outage"))
	)
	const elapsedMs = Date.now() - startedAt

	check(
		outcomes.every((outcome) => outcome.status === "rejected"),
		`${CONCURRENCY} queued commands rejected after the established connection died`
	)
	check(
		elapsedMs < BOUNDED_FAILURE_LIMIT_MS,
		`established outage bounded at ${elapsedMs}ms (< ${BOUNDED_FAILURE_LIMIT_MS}ms)`
	)
	await closeRedis()
	finish()
}

const runId = crypto.randomUUID().slice(0, 8)
const key = (...parts: Array<number | string>) =>
	createRedisKey("verify", runId, ...parts)

const runMainSuite = async () => {
	console.log(`Verifying Redis behavior (namespace pstrack:verify:${runId})`)

	console.log("1. JSON round-trip")
	await redisSet(key("json"), { count: 3, tag: "alpha" })
	const roundTrip = await redisGet<{ count: number; tag: string }>(key("json"))
	check(roundTrip?.count === 3 && roundTrip?.tag === "alpha", "object survives set/get")
	check((await redisGet(key("missing"))) === null, "missing key reads as null")

	console.log("2. TTL")
	await redisSet(key("ttl"), "short-lived", { ttlSeconds: 2 })
	const client = await getRedis()
	const ttl = await client.ttl(key("ttl"))
	check(ttl > 0 && ttl <= 2, `ttl reported within bounds (${ttl}s)`)
	check((await redisGet(key("ttl"))) === "short-lived", "value readable before expiry")

	console.log("3. Set membership and duplicate writes")
	check((await redisSAdd(key("set"), "a", "b")) === 2, "sadd adds two members")
	check((await redisSAdd(key("set"), "a")) === 0, "duplicate sadd is a no-op")
	check(await redisSIsMember(key("set"), "a"), "member found")
	check(!(await redisSIsMember(key("set"), "zzz")), "non-member not found")
	check((await redisExpire(key("set"), 2)) === 1, "expire applies to the set")

	console.log("4. Concurrent operations")
	const additions = await Promise.all(
		Array.from({ length: CONCURRENCY }, () =>
			redisSAdd(key("concurrent-set"), "same-member")
		)
	)
	check(
		additions.reduce((sum, added) => sum + added, 0) === 1,
		`${CONCURRENCY} concurrent duplicate sadds add exactly one member`
	)
	const writes = await Promise.all(
		Array.from({ length: CONCURRENCY }, (_, index) => redisSet(key("kv", index), index))
	)
	check(
		writes.every((result) => result === "OK"),
		`${CONCURRENCY} concurrent sets acknowledged`
	)
	const reads = await Promise.all(
		Array.from({ length: CONCURRENCY }, (_, index) => redisGet<number>(key("kv", index)))
	)
	check(
		reads.every((value, index) => value === index),
		`${CONCURRENCY} concurrent reads round-trip`
	)

	console.log("5. TTL expiry removes keys")
	await sleep(2_500)
	check((await redisGet(key("ttl"))) === null, "TTL key expired")
	check(!(await redisSIsMember(key("set"), "a")), "expired set dropped its members")

	console.log("6. Reconnect after server-side kill")
	if (!env.REDIS_URL) throw new Error("REDIS_URL is required")
	const { RedisClient } = await import("bun")
	const killer = new RedisClient(env.REDIS_URL)
	const ownId = await client.send("CLIENT", ["ID"])
	const killedCount = await killer.send("CLIENT", ["KILL", "ID", String(ownId)])
	check(String(killedCount) === "1", "server killed the app connection")
	await sleep(200)
	const afterReconnect = await redisGet<{ count: number; tag: string }>(key("json"))
	check(
		afterReconnect?.tag === "alpha",
		"helper call succeeds after transparent reconnect"
	)
	killer.close()

	console.log("7. Cleanup")
	const cleanupKeys = [
		key("json"),
		key("set"),
		key("concurrent-set"),
		...Array.from({ length: CONCURRENCY }, (_, index) => key("kv", index)),
	]
	check((await redisDel(...cleanupKeys)) >= 3, "namespaced keys deleted")
	await closeRedis()

	finish()
}

if (process.argv.includes("--outage-after-connect")) {
	await runEstablishedOutageScenario()
} else if (process.argv.includes("--unavailable")) {
	await runUnavailableScenario()
} else {
	await runMainSuite()
}
