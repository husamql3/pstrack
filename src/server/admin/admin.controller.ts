import { Elysia, status } from "elysia"

import { env } from "@/env"
import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"
import { requirePlatformAdmin } from "@/server/lib/session"
import { adminDao } from "./admin.dao"
import { EMAIL_TEMPLATE_MAP, EMAIL_TEMPLATES } from "./admin.emails"
import { adminModel } from "./admin.model"
import { ADMIN_LIST_LIMIT_DEFAULT } from "./admin.type"
import { adminAuditDao } from "./admin-audit.dao"

export const adminController = new Elysia({ prefix: "/admin", tags: ["Admin"] })
	.use(adminModel)
	// ─── Stats ──────────────────────────────────────────────────────────────
	.get("/stats", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return adminDao.getStats()
	})
	// ─── Audit log ──────────────────────────────────────────────────────────
	.get(
		"/audit",
		async ({ request, query }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return adminAuditDao.list({
				actor: query.actor ?? null,
				action: query.action ?? null,
				targetType: query.targetType ?? null,
				targetId: query.targetId ?? null,
				cursor: query.cursor ?? null,
				limit: query.limit ?? ADMIN_LIST_LIMIT_DEFAULT,
			})
		},
		{ query: "admin.audit.list" }
	)
	// ─── Feature flags ──────────────────────────────────────────────────────
	.get("/feature-flags", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return adminDao.listFeatureFlags()
	})
	.post(
		"/feature-flags",
		async ({ request, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			try {
				return await adminDao.createFeatureFlag(user.id, {
					key: body.key,
					enabled: body.enabled,
					description: body.description ?? null,
				})
			} catch {
				return status(409, { error: "Feature flag with this key already exists" })
			}
		},
		{ body: "admin.featureFlags.create" }
	)
	.patch(
		"/feature-flags/:key",
		async ({ request, params, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			try {
				return await adminDao.toggleFeatureFlag(user.id, params.key, body.enabled)
			} catch {
				return status(404, { error: "Feature flag not found" })
			}
		},
		{
			params: "admin.featureFlags.keyParams",
			body: "admin.featureFlags.toggle",
		}
	)
	// ─── System config ──────────────────────────────────────────────────────
	.get("/system-config", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return adminDao.listSystemConfig()
	})
	.put(
		"/system-config",
		async ({ request, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response
			return adminDao.upsertSystemConfig(user.id, {
				key: body.key,
				value: body.value as Prisma.InputJsonValue,
				description: body.description ?? null,
			})
		},
		{ body: "admin.systemConfig.upsert" }
	)
	// ─── Emails ─────────────────────────────────────────────────────────────
	.get("/emails/templates", async ({ request }) => {
		const { user, response } = await requirePlatformAdmin(request)
		if (!user) return response
		return EMAIL_TEMPLATES.map((t) => ({
			key: t.key,
			label: t.label,
			exampleProps: t.exampleProps,
		}))
	})
	.post(
		"/emails/send",
		async ({ request, body }) => {
			const { user, response } = await requirePlatformAdmin(request)
			if (!user) return response

			const template = EMAIL_TEMPLATE_MAP.get(body.template)
			if (!template) return status(400, { error: "Unknown email template" })

			const target = await db.user.findUnique({
				where: { id: body.toUserId },
				select: { id: true, email: true, name: true },
			})
			if (!target) return status(404, { error: "Recipient user not found" })

			const props = (body.props ?? {}) as Record<string, unknown>

			try {
				await sendEmail({
					from: env.EMAIL_FROM,
					to: target.email,
					subject: template.subject(props),
					react: template.render(props),
				})
			} catch (err) {
				captureServerException(err, { tag: "admin:email-send" })
				return status(502, { error: "Failed to send email via Resend" })
			}

			await adminAuditDao.log({
				adminId: user.id,
				action: "EMAIL_SENT",
				target: { type: "EMAIL", id: body.template },
				metadata: { template: body.template, toUserId: target.id },
			})

			return { sent: true, to: target.email }
		},
		{ body: "admin.emails.send" }
	)
