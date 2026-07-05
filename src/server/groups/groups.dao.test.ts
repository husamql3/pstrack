// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const tx = {
	group: {
		create: vi.fn(),
	},
	groupMember: {
		create: vi.fn(),
		update: vi.fn(),
		upsert: vi.fn(),
	},
	groupMemberWarning: {
		updateMany: vi.fn(),
	},
}

vi.mock("@/server/lib/db", () => ({
	db: {
		$transaction: vi.fn(async (callback) => callback(tx)),
		group: {
			findFirst: vi.fn(),
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
		groupJoinRequest: {
			count: vi.fn(),
			findMany: vi.fn(),
			updateMany: vi.fn(),
			upsert: vi.fn(),
		},
		groupMember: {
			count: vi.fn(),
			findUnique: vi.fn(),
		},
		user: {
			findUniqueOrThrow: vi.fn(),
		},
	},
}))

vi.mock("@/server/points/points.dao", () => ({
	pointsDao: {
		applyPointsDelta: vi.fn(),
		hasEverJoinedGroup: vi.fn(),
	},
}))

vi.mock("@/server/problems/problems.dao", () => ({
	problemsDao: {
		assignNextProblemTx: vi.fn(),
	},
}))

import {
	GroupMemberRemovalReason,
	GroupMemberStatus,
	PointReason,
} from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { pointsDao } from "@/server/points/points.dao"
import { JOIN_GROUP_BONUS } from "@/server/points/points.type"
import { problemsDao } from "@/server/problems/problems.dao"
import { groupsDao } from "./groups.dao"

describe("groupsDao", () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date("2026-06-16T12:00:00.000Z"))
	})

	afterEach(() => {
		vi.useRealTimers()
		vi.clearAllMocks()
	})

	describe("createPublic", () => {
		it("creates the group, admin membership, join bonus, and today's first problem", async () => {
			db.user.findUniqueOrThrow.mockResolvedValue({ isPro: false })
			db.groupMember.count.mockResolvedValue(0)
			db.group.findMany.mockResolvedValue([])
			tx.group.create.mockResolvedValue({
				id: "group-1",
				slug: "quiet-array",
				type: "PUBLIC",
				roadmap: "NC250",
				roadmapIndex: 0,
				maxMembers: 30,
				createdAt: new Date("2026-06-16T12:00:00.000Z"),
				_count: { members: 1 },
			})
			problemsDao.assignNextProblemTx.mockResolvedValue({
				id: "daily-1",
				problem: { roadmapIndex: 1 },
			})

			const result = await groupsDao.createPublic("user-1")

			expect(result.error).toBeNull()
			expect(tx.group.create).toHaveBeenCalledWith({
				data: {
					slug: expect.any(String),
					type: "PUBLIC",
					creatorId: "user-1",
					maxMembers: 30,
				},
				select: expect.any(Object),
			})
			expect(tx.groupMember.create).toHaveBeenCalledWith({
				data: { groupId: "group-1", userId: "user-1", role: "ADMIN" },
			})
			expect(pointsDao.applyPointsDelta).toHaveBeenCalledWith(
				"user-1",
				JOIN_GROUP_BONUS,
				PointReason.JOIN_GROUP,
				{ tx, groupId: "group-1" }
			)
			expect(problemsDao.assignNextProblemTx).toHaveBeenCalledWith(
				tx,
				"group-1",
				new Date("2026-06-16T00:00:00.000Z")
			)
			expect(result.group).toMatchObject({
				id: "group-1",
				roadmapIndex: 1,
				membershipStatus: "JOINED",
				memberPreview: [],
				activeToday: 0,
			})
		})

		it("rejects creation when the user has reached their group limit", async () => {
			db.user.findUniqueOrThrow.mockResolvedValue({ isPro: false })
			db.groupMember.count.mockResolvedValue(1)

			const result = await groupsDao.createPublic("user-1")

			expect(result).toEqual({ error: "GROUP_LIMIT", group: null })
			expect(db.$transaction).not.toHaveBeenCalled()
		})
	})

	describe("requestToJoin", () => {
		it("upserts a pending request for public groups when capacity and join limits allow it", async () => {
			db.user.findUniqueOrThrow.mockResolvedValue({ isPro: false })
			db.group.findUnique.mockResolvedValue({
				id: "group-1",
				slug: "quiet-array",
				type: "PUBLIC",
				maxMembers: 30,
				_count: { members: 12 },
			})
			db.groupMember.findUnique.mockResolvedValue(null)
			db.groupMember.count.mockResolvedValue(0)
			db.groupJoinRequest.count.mockResolvedValue(0)
			db.groupJoinRequest.upsert.mockResolvedValue({ id: "request-1" })

			const result = await groupsDao.requestToJoin("user-1", "group-1")

			expect(result).toEqual({
				error: null,
				status: "REQUESTED",
				groupSlug: "quiet-array",
				requestId: "request-1",
			})
			expect(db.groupJoinRequest.upsert).toHaveBeenCalledWith({
				where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
				create: {
					groupId: "group-1",
					userId: "user-1",
					status: "PENDING",
					expiresAt: new Date("2026-06-17T12:00:00.000Z"),
				},
				update: {
					status: "PENDING",
					expiresAt: new Date("2026-06-17T12:00:00.000Z"),
				},
				select: { id: true },
			})
		})

		it("requires invite links for private groups", async () => {
			db.user.findUniqueOrThrow.mockResolvedValue({ isPro: false })
			db.group.findUnique.mockResolvedValue({
				id: "group-1",
				type: "PRIVATE",
				maxMembers: 30,
				_count: { members: 1 },
			})
			db.groupMember.findUnique.mockResolvedValue(null)
			db.groupMember.count.mockResolvedValue(0)
			db.groupJoinRequest.count.mockResolvedValue(0)

			const result = await groupsDao.requestToJoin("user-1", "group-1")

			expect(result).toEqual({ error: "INVITE_REQUIRED", status: null })
			expect(db.groupJoinRequest.upsert).not.toHaveBeenCalled()
		})
	})

	describe("joinByInvite", () => {
		it("reactivates membership and skips join bonus when the user joined before", async () => {
			db.group.findFirst.mockResolvedValue({
				id: "group-1",
				maxMembers: 50,
				_count: { members: 10 },
			})
			db.groupMember.findUnique.mockResolvedValue({
				id: "member-1",
				status: GroupMemberStatus.REMOVED,
			})
			db.user.findUniqueOrThrow.mockResolvedValue({ isPro: true })
			db.groupMember.count.mockResolvedValue(2)
			pointsDao.hasEverJoinedGroup.mockResolvedValue(true)

			const result = await groupsDao.joinByInvite("user-1", "invite-1")

			expect(result).toEqual({ error: null, status: "JOINED", groupId: "group-1" })
			expect(tx.groupMember.upsert).toHaveBeenCalledWith({
				where: { groupId_userId: { groupId: "group-1", userId: "user-1" } },
				create: { groupId: "group-1", userId: "user-1", role: "MEMBER" },
				update: {
					status: GroupMemberStatus.ACTIVE,
					removedAt: null,
					removalReason: null,
				},
			})
			expect(pointsDao.applyPointsDelta).not.toHaveBeenCalled()
		})

		it("returns INVALID_CODE when no active invite matches", async () => {
			db.group.findFirst.mockResolvedValue(null)

			const result = await groupsDao.joinByInvite("user-1", "missing")

			expect(result).toEqual({ error: "INVALID_CODE", groupId: null, status: null })
			expect(db.$transaction).not.toHaveBeenCalled()
		})
	})

	describe("leave", () => {
		it("marks the membership removed and resolves active warnings", async () => {
			db.groupMember.findUnique.mockResolvedValue({
				id: "member-1",
				status: GroupMemberStatus.ACTIVE,
			})

			const result = await groupsDao.leave("user-1", "group-1")

			expect(result).toEqual({ error: null })
			expect(tx.groupMember.update).toHaveBeenCalledWith({
				where: { id: "member-1" },
				data: {
					status: GroupMemberStatus.REMOVED,
					removedAt: expect.any(Date),
					removalReason: GroupMemberRemovalReason.LEFT_GROUP,
				},
			})
			expect(tx.groupMemberWarning.updateMany).toHaveBeenCalledWith({
				where: { groupMemberId: "member-1", resolvedAt: null },
				data: { resolvedAt: expect.any(Date), resolution: "LEFT_GROUP" },
			})
		})
	})

	describe("expirePendingRequests", () => {
		it("expires stale pending join requests and returns notification targets", async () => {
			db.groupJoinRequest.findMany.mockResolvedValue([
				{ id: "req-1", groupId: "group-1", userId: "user-1" },
				{ id: "req-2", groupId: "group-2", userId: "user-2" },
			])

			const result = await groupsDao.expirePendingRequests()

			expect(db.groupJoinRequest.updateMany).toHaveBeenCalledWith({
				where: { id: { in: ["req-1", "req-2"] } },
				data: { status: "EXPIRED" },
			})
			expect(result).toEqual({
				expired: 2,
				requests: [
					{ id: "req-1", groupId: "group-1", userId: "user-1" },
					{ id: "req-2", groupId: "group-2", userId: "user-2" },
				],
			})
		})
	})
})
