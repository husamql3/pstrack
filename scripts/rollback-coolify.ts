const required = (name: string) => {
	const value = process.env[name]
	if (!value) throw new Error(`${name} is not set`)
	return value
}

const main = async () => {
	const previousImageRef = required("PSTRACK_ROLLBACK_IMAGE_REF")
	const previousDigest = previousImageRef.includes("@sha256:")
		? `sha256:${previousImageRef.split("@sha256:")[1]}`
		: previousImageRef

	process.env.PSTRACK_IMAGE_REF = previousImageRef
	process.env.PSTRACK_IMAGE_DIGEST = previousDigest
	process.env.PSTRACK_GIT_SHA = process.env.PSTRACK_ROLLBACK_GIT_SHA ?? "rollback"
	const { deployCoolify } = await import("./deploy-coolify")
	await deployCoolify()
}

main().catch((error) => {
	console.error(error)
	process.exit(1)
})

export {}
