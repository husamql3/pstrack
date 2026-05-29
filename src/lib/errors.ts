export class ProFeatureError extends Error {
	readonly feature: string

	constructor(feature: string) {
		super(`This feature requires a Pro account: ${feature}`)
		this.name = "ProFeatureError"
		this.feature = feature
	}
}
