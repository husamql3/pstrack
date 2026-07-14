import { EventEmitter } from "node:events"
import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest"

import type {
	ResourceCategory,
	ResourceCommand,
} from "../../scripts/measure-container-resources"
import {
	classifyContainer,
	collectCommandOutput,
	parseDockerMemoryBytes,
	parseResourceStats,
	summarizeResourceSamples,
} from "../../scripts/measure-container-resources"

describe("container resource measurement", () => {
	it("classifies containers without retaining runtime names", () => {
		expect(classifyContainer("ghcr.io/husamql3/pstrack:main", "generated-name")).toBe(
			"app"
		)
		expect(
			classifyContainer(
				"ghcr.io/husamql3/pstrack-db-backups:main",
				"generated-backup-name"
			)
		).toBe("backup")
		expect(classifyContainer("deploy-pstrack-db-backups", "backup")).toBe("backup")
		expect(classifyContainer("postgres:18-alpine", "generated-db-name")).toBe("database")
		expect(classifyContainer("postgres:15-alpine", "coolify-db")).toBe("coolify-database")
		expect(classifyContainer("stalwartlabs/stalwart:v0.16.12", "mail")).toBe("mail")
		expect(classifyContainer("traefik:v3.6", "coolify-proxy")).toBe("coolify-proxy")
		expect(classifyContainer("redis:7-alpine", "coolify-redis")).toBe("coolify-cache")
	})

	it("parses Docker binary memory units", () => {
		expect(parseDockerMemoryBytes("282.7MiB / 3.824GiB")).toBe(296_432_435)
		expect(parseDockerMemoryBytes("1.5GiB / 4GiB")).toBe(1_610_612_736)
	})

	it("summarizes samples by category without container identifiers", () => {
		const evidence = summarizeResourceSamples(
			[
				[
					{ category: "app", cpuPercent: 2, memoryBytes: 100, pids: 10 },
					{
						category: "coolify-platform",
						cpuPercent: 1,
						memoryBytes: 50,
						pids: 5,
					},
				],
				[
					{ category: "app", cpuPercent: 4, memoryBytes: 140, pids: 12 },
					{
						category: "coolify-platform",
						cpuPercent: 3,
						memoryBytes: 70,
						pids: 7,
					},
				],
			],
			{
				capturedAt: "2026-07-14T13:00:00.000Z",
				durationMs: 5000,
				intervalMs: 5000,
				hostCpuCount: 2,
				hostMemoryBytes: 4_000,
			}
		)

		expect(evidence).toEqual({
			capturedAt: "2026-07-14T13:00:00.000Z",
			durationMs: 5000,
			sampleCount: 2,
			intervalMs: 5000,
			hostCapacity: { cpuCount: 2, memoryBytes: 4_000 },
			categories: {
				app: {
					observations: 2,
					cpuPercent: { average: 3, maximum: 4 },
					memoryBytes: { average: 120, maximum: 140 },
					pids: { average: 11, maximum: 12 },
				},
				"coolify-platform": {
					observations: 2,
					cpuPercent: { average: 2, maximum: 3 },
					memoryBytes: { average: 60, maximum: 70 },
					pids: { average: 6, maximum: 7 },
				},
				"coolify-total": {
					observations: 2,
					cpuPercent: { average: 2, maximum: 3 },
					memoryBytes: { average: 60, maximum: 70 },
					pids: { average: 6, maximum: 7 },
				},
			},
		})
		expect(JSON.stringify(evidence)).not.toContain("generated")
	})

	it("averages transient categories across the complete measurement window", () => {
		const evidence = summarizeResourceSamples(
			[[{ category: "backup", cpuPercent: 10, memoryBytes: 100, pids: 2 }], []],
			{
				capturedAt: "2026-07-14T18:00:00.000Z",
				durationMs: 5000,
				intervalMs: 5000,
				hostCpuCount: 2,
				hostMemoryBytes: 4_000,
			}
		)

		expect(evidence.categories.backup).toEqual({
			observations: 2,
			cpuPercent: { average: 5, maximum: 10 },
			memoryBytes: { average: 50, maximum: 100 },
			pids: { average: 1, maximum: 2 },
		})
	})

	it("fails closed for empty, malformed, and unmatched Docker stats", () => {
		const categories = new Map<string, ResourceCategory>([["app-1", "app"]])
		expect(() => parseResourceStats([], categories)).toThrow("no resource stats")
		expect(() => parseResourceStats([{ Name: "app-1" }], categories)).toThrow(
			"incomplete resource stats"
		)
		expect(() =>
			parseResourceStats(
				[
					{
						Name: "app-1",
						CPUPerc: "invalid",
						MemUsage: "1MiB / 4GiB",
						PIDs: "1",
					},
				],
				categories
			)
		).toThrow("invalid resource stats")
		expect(() =>
			parseResourceStats(
				[
					{
						Name: "unknown",
						CPUPerc: "1%",
						MemUsage: "1MiB / 4GiB",
						PIDs: "1",
					},
				],
				categories
			)
		).toThrow("did not match container metadata")
	})

	it("kills timed-out commands and ignores a late close", async () => {
		const events = new EventEmitter()
		const stdout = new PassThrough()
		let killed = false
		const command: ResourceCommand = {
			stdout,
			once: (event, listener) => {
				events.once(event, listener)
				return command
			},
			kill: () => {
				killed = true
				return true
			},
		}
		const result = collectCommandOutput(command, 1)
		await expect(result).rejects.toThrow("timed out")
		expect(killed).toBe(true)
		events.emit("close", 0)
	})
})
