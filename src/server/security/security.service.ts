import { captureServerMessage } from "@/server/lib/sentry"
import type { CspViolationSummary } from "./security.type"

const REPORT_DEDUPLICATION_WINDOW_MS = 5 * 60 * 1000
const MAX_DEDUPLICATION_KEYS = 128
const recentReports = new Map<string, number>()

export const recordCspViolation = (summary: CspViolationSummary) => {
	const now = Date.now()
	const key = `${summary.effectiveDirective}:${summary.documentArea}`
	const lastReportedAt = recentReports.get(key)
	if (lastReportedAt && now - lastReportedAt < REPORT_DEDUPLICATION_WINDOW_MS) return

	if (recentReports.size >= MAX_DEDUPLICATION_KEYS) {
		for (const [existingKey, reportedAt] of recentReports) {
			if (now - reportedAt >= REPORT_DEDUPLICATION_WINDOW_MS) {
				recentReports.delete(existingKey)
			}
		}
	}
	if (recentReports.size >= MAX_DEDUPLICATION_KEYS) return

	recentReports.set(key, now)
	captureServerMessage("Content Security Policy violation", summary)
}
