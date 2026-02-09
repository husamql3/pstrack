import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

import { env } from "@/env";
import { error } from "@/lib/response";
import { logger } from "@/middlewares/logger";
import type { AppType } from "@/types/app.type";

export const createRouter = () => {
	return new Hono<AppType>({
		strict: false,
	});
};

export const createApp = () => {
	return createRouter()
		.use("*", logger())
		.use(
			"*",
			cors({
				origin: "*", // TODO: restrict to only the allowed origins
				credentials: true,
				allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
				allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
			}),
		)
		.onError(async (e, c) => {
			if (e instanceof HTTPException) {
				return error(c, e.message, e.status);
			}

			const isDevelopment = env.NODE_ENV === "development";
			return error(c, isDevelopment ? e.message : "Internal Server Error", 500);
		})
		.notFound((c) => {
			return error(c, "Resource not found", 404);
		});
	// .get("/", (c) => {
	// 	return success(
	// 		c,
	// 		{
	// 			message: "pstrack API v3",
	// 			version: "3.0.0",
	// 		},
	// 		200,
	// 	);
	// })
	// .post(
	// 	"/test-validation",
	// 	validator(
	// 		"json",
	// 		z.object({
	// 			email: z.email("Invalid email format"),
	// 			age: z.number().min(18, "Must be at least 18 years old"),
	// 			name: z.string().min(2, "Name must be at least 2 characters"),
	// 		}),
	// 	),
	// 	(c) => {
	// 		const data = c.req.valid("json");
	// 		return success(c, { message: "Validation passed!", data }, 200);
	// 	},
	// );
};
