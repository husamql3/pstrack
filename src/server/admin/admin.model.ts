import Elysia, { t } from "elysia"

import {
	AdminAuditAction,
	AdminAuditTargetType,
	Difficulty,
	ProblemSource,
} from "@/generated/prisma/enums"
import { ADMIN_LIST_LIMIT_DEFAULT, ADMIN_LIST_LIMIT_MAX } from "./admin.type"

const limitSchema = t.Optional(
	t.Number({
		minimum: 1,
		maximum: ADMIN_LIST_LIMIT_MAX,
		default: ADMIN_LIST_LIMIT_DEFAULT,
	})
)

export const paginationQuery = t.Object({
	cursor: t.Optional(t.String({ minLength: 1 })),
	limit: limitSchema,
	q: t.Optional(t.String()),
	sortBy: t.Optional(t.String()),
	sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
})

export const adminModel = new Elysia({ name: "model/admin" }).model({
	"admin.pagination": paginationQuery,

	"admin.users.list": t.Composite([
		paginationQuery,
		t.Object({
			role: t.Optional(t.Union([t.Literal("admin"), t.Literal("user")])),
			isPro: t.Optional(t.Boolean()),
			banned: t.Optional(t.Boolean()),
		}),
	]),
	"admin.users.idParams": t.Object({ id: t.String({ minLength: 1 }) }),
	"admin.users.ban": t.Object({
		banned: t.Boolean(),
		reason: t.Optional(t.String({ maxLength: 280 })),
	}),
	"admin.users.adjustPoints": t.Object({
		delta: t.Integer(),
		reason: t.String({ minLength: 1, maxLength: 280 }),
	}),
	"admin.users.proGrant": t.Object({
		grant: t.Boolean(),
		expiresAt: t.Optional(t.Union([t.String({ format: "date-time" }), t.Null()])),
		reason: t.String({ minLength: 1, maxLength: 280 }),
	}),
	"admin.users.impersonationEnded": t.Object({
		durationMs: t.Optional(t.Integer({ minimum: 0 })),
	}),

	"admin.groups.list": t.Composite([
		paginationQuery,
		t.Object({
			type: t.Optional(t.Union([t.Literal("PUBLIC"), t.Literal("PRIVATE")])),
			frozen: t.Optional(t.Boolean()),
			isActive: t.Optional(t.Boolean()),
		}),
	]),
	"admin.groups.idParams": t.Object({ id: t.String({ minLength: 1 }) }),
	"admin.groups.freeze": t.Object({ frozen: t.Boolean() }),

	"admin.problems.list": t.Composite([
		paginationQuery,
		t.Object({
			difficulty: t.Optional(t.Enum(Difficulty)),
			source: t.Optional(t.Enum(ProblemSource)),
			roadmap: t.Optional(
				t.Union([t.Literal("NC250"), t.Literal("NC150"), t.Literal("BLIND75")])
			),
		}),
	]),
	"admin.problems.idParams": t.Object({ id: t.String({ minLength: 1 }) }),
	"admin.problems.create": t.Object({
		slug: t.String({ minLength: 1, maxLength: 120 }),
		title: t.String({ minLength: 1, maxLength: 200 }),
		difficulty: t.Enum(Difficulty),
		topic: t.String({ minLength: 1, maxLength: 80 }),
		leetcodeId: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
		neetcode250: t.Optional(t.Boolean()),
		neetcode150: t.Optional(t.Boolean()),
		blind75: t.Optional(t.Boolean()),
	}),
	"admin.problems.update": t.Object({
		title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
		difficulty: t.Optional(t.Enum(Difficulty)),
		topic: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
		leetcodeId: t.Optional(t.Union([t.Integer({ minimum: 1 }), t.Null()])),
		neetcode250: t.Optional(t.Boolean()),
		neetcode150: t.Optional(t.Boolean()),
		blind75: t.Optional(t.Boolean()),
	}),

	"admin.audit.list": t.Composite([
		paginationQuery,
		t.Object({
			actor: t.Optional(t.String({ minLength: 1 })),
			action: t.Optional(t.Enum(AdminAuditAction)),
			targetType: t.Optional(t.Enum(AdminAuditTargetType)),
			targetId: t.Optional(t.String({ minLength: 1 })),
		}),
	]),

	"admin.featureFlags.keyParams": t.Object({
		key: t.String({ minLength: 1, maxLength: 80 }),
	}),
	"admin.featureFlags.toggle": t.Object({ enabled: t.Boolean() }),
	"admin.featureFlags.create": t.Object({
		key: t.String({ minLength: 1, maxLength: 80 }),
		enabled: t.Boolean(),
		description: t.Optional(t.Union([t.String({ maxLength: 280 }), t.Null()])),
	}),

	"admin.systemConfig.keyParams": t.Object({
		key: t.String({ minLength: 1, maxLength: 80 }),
	}),
	"admin.systemConfig.upsert": t.Object({
		key: t.String({ minLength: 1, maxLength: 80 }),
		value: t.Unknown(),
		description: t.Optional(t.Union([t.String({ maxLength: 280 }), t.Null()])),
	}),

	"admin.emails.send": t.Object({
		template: t.String({ minLength: 1, maxLength: 80 }),
		toUserId: t.String({ minLength: 1 }),
		props: t.Optional(t.Record(t.String(), t.Unknown())),
	}),
})
