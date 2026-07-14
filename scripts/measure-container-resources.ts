import { spawn } from "node:child_process"
import { writeFile } from "node:fs/promises"
import type { Readable } from "node:stream"

export type ResourceCategory =
	| "app"
	| "database"
	| "mail"
	| "backup"
	| "coolify-proxy"
	| "coolify-database"
	| "coolify-cache"
	| "coolify-platform"
	| "coolify-total"
	| "other"

export type ResourceObservation = {
	category: ResourceCategory
	cpuPercent: number
	memoryBytes: number
	pids: number
}

type SummaryOptions = {
	capturedAt: string
	durationMs: number
	intervalMs: number
	hostCpuCount: number
	hostMemoryBytes: number
}

const round = (value: number) => Math.round(value * 100) / 100

export const classifyContainer = (image: string, name: string): ResourceCategory => {
	const normalizedImage = image.toLowerCase()
	const normalizedName = name.toLowerCase()

	if (
		normalizedImage.includes("pstrack-db-backups") ||
		normalizedName.includes("pstrack-db-backups")
	) {
		return "backup"
	}
	if (normalizedImage.includes("husamql3/pstrack")) return "app"
	if (normalizedImage.includes("stalwart")) return "mail"
	if (normalizedImage.includes("traefik")) return "coolify-proxy"
	if (normalizedName.includes("coolify") && normalizedImage.startsWith("postgres:")) {
		return "coolify-database"
	}
	if (
		normalizedName.includes("coolify") &&
		(normalizedImage.includes("redis") || normalizedImage.includes("keydb"))
	) {
		return "coolify-cache"
	}
	if (normalizedName.includes("coolify") || normalizedImage.includes("coollabsio")) {
		return "coolify-platform"
	}
	if (normalizedImage.startsWith("postgres:")) return "database"
	return "other"
}

const MEMORY_UNITS: Record<string, number> = {
	b: 1,
	kib: 1024,
	mib: 1024 ** 2,
	gib: 1024 ** 3,
	tib: 1024 ** 4,
	kb: 1000,
	mb: 1000 ** 2,
	gb: 1000 ** 3,
	tb: 1000 ** 4,
}

export const parseDockerMemoryBytes = (usage: string) => {
	const current = usage.split("/")[0]?.trim() ?? ""
	const match = current.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-z]+)$/i)
	if (!match) throw new Error("Docker returned an invalid memory measurement")
	const value = Number(match[1])
	const multiplier = MEMORY_UNITS[match[2]?.toLowerCase() ?? ""]
	if (!Number.isFinite(value) || !multiplier) {
		throw new Error("Docker returned an unsupported memory measurement")
	}
	return Math.round(value * multiplier)
}

export const summarizeResourceSamples = (
	samples: ResourceObservation[][],
	options: SummaryOptions
) => {
	const byCategory = new Map<
		ResourceCategory,
		Array<{ cpuPercent: number; memoryBytes: number; pids: number }>
	>()
	const totalsBySample: Map<
		ResourceCategory,
		{ cpuPercent: number; memoryBytes: number; pids: number }
	>[] = []

	for (const sample of samples) {
		const totals = new Map<
			ResourceCategory,
			{ cpuPercent: number; memoryBytes: number; pids: number }
		>()
		for (const observation of sample) {
			const current = totals.get(observation.category) ?? {
				cpuPercent: 0,
				memoryBytes: 0,
				pids: 0,
			}
			current.cpuPercent += observation.cpuPercent
			current.memoryBytes += observation.memoryBytes
			current.pids += observation.pids
			totals.set(observation.category, current)
			if (observation.category.startsWith("coolify-")) {
				const aggregate = totals.get("coolify-total") ?? {
					cpuPercent: 0,
					memoryBytes: 0,
					pids: 0,
				}
				aggregate.cpuPercent += observation.cpuPercent
				aggregate.memoryBytes += observation.memoryBytes
				aggregate.pids += observation.pids
				totals.set("coolify-total", aggregate)
			}
		}
		totalsBySample.push(totals)
	}

	const categories = new Set(totalsBySample.flatMap((totals) => [...totals.keys()]))
	for (const category of categories) {
		byCategory.set(
			category,
			totalsBySample.map(
				(totals) => totals.get(category) ?? { cpuPercent: 0, memoryBytes: 0, pids: 0 }
			)
		)
	}

	const categorySummaries = Object.fromEntries(
		[...byCategory.entries()].map(([category, values]) => {
			const average = (field: "cpuPercent" | "memoryBytes" | "pids") =>
				round(values.reduce((sum, value) => sum + value[field], 0) / values.length)
			const maximum = (field: "cpuPercent" | "memoryBytes" | "pids") =>
				round(Math.max(...values.map((value) => value[field])))
			return [
				category,
				{
					observations: values.length,
					cpuPercent: {
						average: average("cpuPercent"),
						maximum: maximum("cpuPercent"),
					},
					memoryBytes: {
						average: average("memoryBytes"),
						maximum: maximum("memoryBytes"),
					},
					pids: { average: average("pids"), maximum: maximum("pids") },
				},
			]
		})
	)

	return {
		capturedAt: options.capturedAt,
		durationMs: options.durationMs,
		sampleCount: samples.length,
		intervalMs: options.intervalMs,
		hostCapacity: {
			cpuCount: options.hostCpuCount,
			memoryBytes: options.hostMemoryBytes,
		},
		categories: categorySummaries,
	}
}

const readIntegerInRange = (
	name: string,
	fallback: number,
	{ minimum, maximum }: { minimum: number; maximum: number }
) => {
	const raw = process.env[name]
	if (!raw) return fallback
	const value = Number(raw)
	if (!Number.isInteger(value) || value < minimum || value > maximum) {
		throw new Error(`${name} must be an integer from ${minimum} to ${maximum}`)
	}
	return value
}

const parseJsonLines = (value: string) =>
	value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line): unknown => JSON.parse(line))

const readString = (value: unknown, key: string) => {
	if (!value || typeof value !== "object") return null
	const field = Reflect.get(value, key)
	return typeof field === "string" ? field : null
}

export type ResourceCommand = {
	stdout: Readable
	once: (
		event: "error" | "close",
		listener: (value?: Error | number | null) => void
	) => ResourceCommand
	kill: (signal: NodeJS.Signals) => boolean
}

export const collectCommandOutput = (child: ResourceCommand, timeoutMs: number) =>
	new Promise<string>((resolve, reject) => {
		let stdout = ""
		let settled = false
		const finish = (callback: () => void) => {
			if (settled) return
			settled = true
			clearTimeout(timeout)
			callback()
		}
		const timeout = setTimeout(() => {
			child.kill("SIGKILL")
			finish(() => reject(new Error("Remote Docker inspection timed out")))
		}, timeoutMs)
		child.stdout.setEncoding("utf8")
		child.stdout.on("data", (chunk: string) => {
			stdout += chunk
		})
		child.once("error", () =>
			finish(() => reject(new Error("Remote Docker inspection failed")))
		)
		child.once("close", (exitCode) => {
			finish(() => {
				if (exitCode === 0) resolve(stdout)
				else reject(new Error("Remote Docker inspection failed"))
			})
		})
	})

const readNumber = (value: unknown, key: string) => {
	if (!value || typeof value !== "object") return null
	const field = Reflect.get(value, key)
	return typeof field === "number" && Number.isFinite(field) ? field : null
}

const runSshDocker = async (host: string, args: string[]) => {
	return new Promise<string>((resolve, reject) => {
		const remoteCommand = ["docker", ...args]
			.map((value) => `'${value.replaceAll("'", `'\\''`)}'`)
			.join(" ")
		const child = spawn(
			"ssh",
			["-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host, remoteCommand],
			{ stdio: ["ignore", "pipe", "ignore"] }
		)
		collectCommandOutput(child, 30_000).then(resolve, reject)
	})
}

export const parseResourceStats = (
	stats: unknown[],
	categoryByName: Map<string, ResourceCategory>
) => {
	const observations = stats.map((stat) => {
		const name = readString(stat, "Name")
		const cpu = readString(stat, "CPUPerc")
		const memory = readString(stat, "MemUsage")
		const pids = readString(stat, "PIDs")
		if (!name || !cpu || !memory || !pids) {
			throw new Error("Docker returned incomplete resource stats")
		}
		const cpuPercent = Number(cpu.replace(/%$/, ""))
		const pidCount = Number(pids)
		if (!Number.isFinite(cpuPercent) || !Number.isFinite(pidCount)) {
			throw new Error("Docker returned invalid resource stats")
		}
		const category = categoryByName.get(name)
		if (!category) throw new Error("Docker stats did not match container metadata")
		return {
			category,
			cpuPercent,
			memoryBytes: parseDockerMemoryBytes(memory),
			pids: pidCount,
		}
	})
	if (observations.length === 0) throw new Error("Docker returned no resource stats")
	return observations
}

const collectSample = async (host: string): Promise<ResourceObservation[]> => {
	const containers = parseJsonLines(
		await runSshDocker(host, ["ps", "--format", "{{json .}}"])
	)
	const categoryByName = new Map<string, ResourceCategory>()
	for (const container of containers) {
		const name = readString(container, "Names")
		const image = readString(container, "Image")
		if (name && image) categoryByName.set(name, classifyContainer(image, name))
	}

	const stats = parseJsonLines(
		await runSshDocker(host, ["stats", "--no-stream", "--format", "{{json .}}"])
	)
	return parseResourceStats(stats, categoryByName)
}

const main = async () => {
	const host = process.env.PSTRACK_SSH_HOST ?? "pstrack"
	if (!/^[a-z0-9._-]+$/i.test(host)) throw new Error("PSTRACK_SSH_HOST is invalid")
	const sampleCount = readIntegerInRange("RESOURCE_SAMPLE_COUNT", 12, {
		minimum: 1,
		maximum: 360,
	})
	const intervalMs = readIntegerInRange("RESOURCE_SAMPLE_INTERVAL_MS", 5000, {
		minimum: 250,
		maximum: 60_000,
	})
	const startedAt = new Date()

	const infoRows = parseJsonLines(
		await runSshDocker(host, ["info", "--format", "{{json .}}"])
	)
	const info = infoRows[0]
	const hostCpuCount = readNumber(info, "NCPU")
	const hostMemoryBytes = readNumber(info, "MemTotal")
	if (!hostCpuCount || !hostMemoryBytes) {
		throw new Error("Docker did not report host capacity")
	}

	const samples: ResourceObservation[][] = []
	for (let index = 0; index < sampleCount; index++) {
		samples.push(await collectSample(host))
		if (index + 1 < sampleCount) {
			await new Promise((resolve) => setTimeout(resolve, intervalMs))
		}
	}

	const evidence = summarizeResourceSamples(samples, {
		capturedAt: startedAt.toISOString(),
		durationMs: Date.now() - startedAt.getTime(),
		intervalMs,
		hostCpuCount,
		hostMemoryBytes,
	})
	await writeFile(
		"resource-measurement-evidence.json",
		`${JSON.stringify(evidence, null, 2)}\n`
	)
	console.log(JSON.stringify(evidence, null, 2))
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error instanceof Error ? error.message : "Resource measurement failed")
		process.exit(1)
	})
}
