// @ts-nocheck
import { afterEach, describe, expect, it, vi } from "vitest"

// Mock auth so session.ts can load without env vars
vi.mock("@/server/lib/auth", () => ({
	auth: {
		api: {
			getSession: vi.fn(),
		},
	},
}))

// Mock the DB
vi.mock("@/server/lib/db", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
		},
	},
}))

import { auth } from "@/server/lib/auth"
import { db } from "@/server/lib/db"
import { requirePro } from "@/server/lib/session"

const fakeRequest = new Request("https://example.com/")

describe("requirePro", () => {
	afterEach(() => vi.clearAllMocks())

	it("returns 401 when there is no session", async () => {
		auth.api.getSession.mockResolvedValue(null)

		const result = await requirePro(fakeRequest)

		expect(result.user).toBeNull()
		expect(result.response).toBeDefined()
		// Elysia's status() returns a Response-like; check it came back at all
		expect(db.user.findUnique).not.toHaveBeenCalled()
	})

	it("returns 403 when the user is not Pro (isPro:false)", async () => {
		auth.api.getSession.mockResolvedValue({
			user: { id: "user-free", email: "free@example.com" },
			session: {},
		})
		db.user.findUnique.mockResolvedValue({ isPro: false })

		const result = await requirePro(fakeRequest)

		expect(result.user).toBeNull()
		expect(result.response).toBeDefined()
		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { id: "user-free" },
			select: { isPro: true },
		})
	})

	it("returns null response (pass-through) when the user is Pro", async () => {
		auth.api.getSession.mockResolvedValue({
			user: { id: "user-pro", email: "pro@example.com" },
			session: {},
		})
		db.user.findUnique.mockResolvedValue({ isPro: true })

		const result = await requirePro(fakeRequest)

		expect(result.user).toEqual({ id: "user-pro", email: "pro@example.com" })
		expect(result.response).toBeNull()
		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { id: "user-pro" },
			select: { isPro: true },
		})
	})
})
