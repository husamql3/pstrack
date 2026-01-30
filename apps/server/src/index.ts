import { env as workerEnv } from "cloudflare:workers";
import { Hono } from "hono";

// TODO: base url will be `https://pstrack.app/api/v3`

const app = new Hono();

app.get("/", (c) => {
	return c.json({
		message: "Hello Hono!",
		apiUrl: workerEnv.VITE_API_URL,
	});
});

export default app;
