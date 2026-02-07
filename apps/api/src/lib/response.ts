import type { Context } from "hono";
import { type ContentfulStatusCode } from "hono/utils/http-status";

export const success = <T>(c: Context, data: T, status: ContentfulStatusCode) => {
	return c.json<T>(data, status);
};

export const error = (c: Context, message: string, status: ContentfulStatusCode) => {
	return c.json({ message }, status);
};
