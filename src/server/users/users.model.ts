import Elysia, { t } from "elysia"

export const usersModel = new Elysia({ name: "model/users" }).model({
	"users.checkUsername": t.Object({ username: t.String({ minLength: 1 }) }),
	"users.validateHandle": t.Object({ handle: t.String({ minLength: 1 }) }),
})
