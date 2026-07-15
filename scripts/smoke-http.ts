const defaultSleep = (milliseconds: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, milliseconds))

export type SmokeFetcher = (
	input: RequestInfo | URL,
	init?: RequestInit
) => Promise<Response>

export const fetchWhenReady = async (
	url: string,
	{
		fetcher = fetch,
		maxAttempts = 12,
		retryDelayMs = 5000,
		sleep = defaultSleep,
	}: {
		fetcher?: SmokeFetcher
		maxAttempts?: number
		retryDelayMs?: number
		sleep?: (milliseconds: number) => Promise<void>
	} = {}
) => {
	let lastError: Error | undefined

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			const response = await fetcher(url)
			if (response.ok) return response

			const body = await response.clone().text()
			lastError = new Error(
				`${url} returned ${response.status} after ${attempt} attempt${attempt === 1 ? "" : "s"}${body ? `: ${body}` : ""}`
			)
			if (response.status < 500) throw lastError
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error))
		}

		if (attempt < maxAttempts) {
			console.warn(
				`Smoke target is not ready (attempt ${attempt}/${maxAttempts}): ${lastError.message}`
			)
			await sleep(retryDelayMs)
		}
	}

	throw lastError ?? new Error(`${url} did not become ready`)
}
