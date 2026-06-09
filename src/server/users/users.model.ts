import Elysia, { t } from "elysia"

import {
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN,
} from "./users.constants"

const usernameSchema = t.String({
	pattern: USERNAME_PATTERN,
	minLength: USERNAME_MIN_LENGTH,
	maxLength: USERNAME_MAX_LENGTH,
})

const optionalNullable = (schema: ReturnType<typeof t.String>) =>
	t.Optional(t.Union([schema, t.Null()]))

export const usersModel = new Elysia({ name: "model/users" }).model({
	"users.checkUsername": t.Object({ username: usernameSchema }),
	"users.validateHandle": t.Object({ handle: t.String({ minLength: 1 }) }),
	"users.usernameParams": t.Object({ username: t.String({ minLength: 1 }) }),
	"users.updateUsername": t.Object({ username: usernameSchema }),
	"users.updateProfile": t.Object({
		name: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
		bio: optionalNullable(t.String({ maxLength: 280 })),
		twitterHandle: optionalNullable(t.String({ maxLength: 40 })),
		linkedinHandle: optionalNullable(t.String({ maxLength: 80 })),
		websiteUrl: optionalNullable(t.String({ maxLength: 200 })),
		isPublic: t.Optional(t.Boolean()),
	}),
	"users.updateHandles": t.Object({
		leetcodeHandle: t.String({ minLength: 1, maxLength: 50 }),
		codeforcesHandle: optionalNullable(t.String({ maxLength: 50 })),
	}),
	"users.updateNotifications": t.Object({
		notifyDailyProblem: t.Boolean(),
		notifyAchievements: t.Boolean(),
		notifyGroupActivity: t.Boolean(),
	}),
	"users.sessionParams": t.Object({ id: t.String({ minLength: 1 }) }),
})
