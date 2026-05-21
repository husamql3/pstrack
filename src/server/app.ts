import { Elysia } from "elysia"

export const app = new Elysia({ prefix: "/api/v3" }).get("/ping", () => "pong")

export type App = typeof app
