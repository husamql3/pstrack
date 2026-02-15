import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";

import { error } from "@/lib/response";
import { log } from "@/middlewares/logger";

export const validator = <T extends ZodType>(target: "json" | "query" | "param" | "form", schema: T) => {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			log.error("Validation failed", { error: result.error.issues.map((issue) => issue.message) });
			const errorMsg = result.error.issues[0]?.message ?? "Validation failed";
			return error(c, errorMsg, 400);
		}
	});
};
