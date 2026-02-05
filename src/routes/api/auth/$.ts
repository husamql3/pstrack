import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/auth";

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) => {
				return auth.handler(request);
			},
			POST: ({ request }: { request: Request }) => {
				return auth.handler(request);
			},
		},
	},
});
