import type { RoadmapProblemResponse } from "@/server/problems/problems.type"

export function groupByTopic(list: RoadmapProblemResponse[]) {
	const sorted = [...list].sort((a, b) => a.roadmapIndex - b.roadmapIndex)
	const categoryOrder: string[] = []
	const groups = new Map<string, RoadmapProblemResponse[]>()

	for (const p of sorted) {
		const topic = p.topic ?? "Other"
		if (!groups.has(topic)) {
			groups.set(topic, [])
			categoryOrder.push(topic)
		}
		groups.get(topic)?.push(p)
	}

	return categoryOrder.map((topic) => ({ topic, problems: groups.get(topic) ?? [] }))
}
