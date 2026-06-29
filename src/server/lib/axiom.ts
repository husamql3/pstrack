import { Axiom } from "@axiomhq/js"

import { env } from "@/env"

const client =
	env.AXIOM_TOKEN && env.AXIOM_DATASET ? new Axiom({ token: env.AXIOM_TOKEN }) : null

export type ObservabilityEvent =
	| "solve_attempted"
	| "verification_started"
	| "external_api_called"
	| "external_api_response"
	| "verification_succeeded"
	| "verification_failed"

export const axiomLog = (
	event: ObservabilityEvent,
	payload: { userId?: string; sessionId?: string | null; [key: string]: unknown }
) => {
	if (!client || !env.AXIOM_DATASET) return
	client.ingest(env.AXIOM_DATASET, [{ event, ...payload }])
	client.flush().catch(() => {})
}
