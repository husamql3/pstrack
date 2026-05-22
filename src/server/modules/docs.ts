import openapi from "@elysiajs/openapi"
import { Elysia } from "elysia"

export const docs = new Elysia({ name: "docs" }).use(
	openapi({
		provider: "scalar",
		documentation: {
			info: {
				title: "PSTrack API",
				version: "3.0.0",
			},
		},
		scalar: {
			theme: "kepler",
		},
	})
)
