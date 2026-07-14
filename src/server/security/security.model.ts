import Elysia, { t } from "elysia"

export const securityModel = new Elysia({ name: "model/security" }).model({
	"security.cspReport": t.String(),
})
