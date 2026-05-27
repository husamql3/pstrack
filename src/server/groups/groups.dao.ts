import slugsPool from "@/data/slugs.json"
import { SolveStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import {
	type GroupDetailResponse,
	type GroupListResponse,
	type GroupMemberResponse,
	groupDetailSelect,
	groupListSelect,
	groupMemberSelect,
	type JoinRequestResponse,
	joinRequestSelect,
} from "./groups.type"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const joinLimitFor = (user: { isPro: boolean }) => (user.isPro ? 5 : 1)
const capacityFor = (user: { isPro: boolean }) => (user.isPro ? 50 : 30)

async function pickSlug(): Promise<string> {
	const used = await db.group.findMany({
		where: { slug: { in: slugsPool as string[] } },
		select: { slug: true },
	})
	const usedSet = new Set(used.map((g) => g.slug))
	const available = (slugsPool as string[]).filter((s) => !usedSet.has(s))
	if (available.length === 0) throw new Error("Slug pool exhausted — add more slugs.")
	return available[Math.floor(Math.random() * available.length)]
}

// ─── DAO ──────────────────────────────────────────────────────────────────────

export const groupsDao = {
	listAll: async (userId?: string): Promise<GroupListResponse[]> => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const rows = await db.group.findMany({
			where: { isActive: true },
			orderBy: [{ members: { _count: "desc" } }, { createdAt: "asc" }],
			select: {
				...groupListSelect,
				members: {
					orderBy: [{ role: "asc" }, { joinedAt: "desc" }],
					take: 4,
					select: { user: { select: { username: true } } },
				},
				dailyProblems: {
					where: { assignedDate: today },
					take: 1,
					select: {
						_count: {
							select: {
								solves: {
									where: {
										status: {
											in: [SolveStatus.SOLVED, SolveStatus.PENDING_VERIFICATION],
										},
									},
								},
							},
						},
					},
				},
			},
		})

		const groups: GroupListResponse[] = rows.map(
			({ members, dailyProblems, ...rest }) => ({
				...rest,
				memberPreview: members.map((m) => ({ username: m.user.username })),
				activeToday: dailyProblems[0]?._count.solves ?? 0,
				membershipStatus: "NONE" as const,
			})
		)

		if (!userId) return groups

		const ids = groups.map((g) => g.id)
		const [memberships, requests] = await Promise.all([
			db.groupMember.findMany({
				where: { userId, groupId: { in: ids } },
				select: { groupId: true },
			}),
			db.groupJoinRequest.findMany({
				where: { userId, groupId: { in: ids }, status: "PENDING" },
				select: { groupId: true },
			}),
		])

		const joinedIds = new Set(memberships.map((m) => m.groupId))
		const requestedIds = new Set(requests.map((r) => r.groupId))

		return groups.map((g) => ({
			...g,
			membershipStatus: joinedIds.has(g.id)
				? ("JOINED" as const)
				: requestedIds.has(g.id)
					? ("REQUESTED" as const)
					: ("NONE" as const),
		}))
	},

	createPublic: async (userId: string) => {
		const user = await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { isPro: true },
		})
		const memberships = await db.groupMember.count({ where: { userId } })
		if (memberships >= joinLimitFor(user)) {
			return { error: "GROUP_LIMIT" as const, group: null }
		}

		const slug = await pickSlug()

		const group = await db.$transaction(async (tx) => {
			const created = await tx.group.create({
				data: {
					slug,
					type: "PUBLIC",
					creatorId: userId,
					maxMembers: capacityFor(user),
				},
				select: groupListSelect,
			})
			await tx.groupMember.create({
				data: { groupId: created.id, userId, role: "ADMIN" },
			})
			return created
		})

		return {
			error: null,
			group: {
				...group,
				membershipStatus: "JOINED" as const,
				memberPreview: [],
				activeToday: 0,
			},
		}
	},

	requestToJoin: async (userId: string, groupId: string) => {
		const [user, group, existingMembership] = await Promise.all([
			db.user.findUniqueOrThrow({ where: { id: userId }, select: { isPro: true } }),
			db.group.findUnique({
				where: { id: groupId },
				select: {
					id: true,
					type: true,
					maxMembers: true,
					_count: { select: { members: true } },
				},
			}),
			db.groupMember.findUnique({
				where: { groupId_userId: { groupId, userId } },
				select: { id: true },
			}),
		])

		if (!group) return { error: "NOT_FOUND" as const, status: null }
		if (existingMembership) return { error: null, status: "JOINED" as const }
		if (group._count.members >= group.maxMembers) {
			return { error: "FULL" as const, status: null }
		}

		const memberships = await db.groupMember.count({ where: { userId } })
		if (memberships >= joinLimitFor(user)) {
			return { error: "GROUP_LIMIT" as const, status: null }
		}

		if (group.type === "PRIVATE") {
			return { error: "INVITE_REQUIRED" as const, status: null }
		}

		await db.groupJoinRequest.upsert({
			where: { groupId_userId: { groupId, userId } },
			create: {
				groupId,
				userId,
				status: "PENDING",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			},
			update: {
				status: "PENDING",
				expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
			},
		})

		return { error: null, status: "REQUESTED" as const }
	},

	findById: async (
		userId: string | undefined,
		groupId: string
	): Promise<GroupDetailResponse | null> => {
		const group = await db.group.findUnique({
			where: { id: groupId, isActive: true },
			select: groupDetailSelect,
		})
		if (!group) return null

		if (!userId) return { ...group, membershipStatus: "NONE", userRole: null }

		const [membership, request] = await Promise.all([
			db.groupMember.findUnique({
				where: { groupId_userId: { groupId, userId } },
				select: { role: true },
			}),
			db.groupJoinRequest.findUnique({
				where: { groupId_userId: { groupId, userId } },
				select: { status: true },
			}),
		])

		if (membership) {
			return { ...group, membershipStatus: "JOINED", userRole: membership.role }
		}
		if (request?.status === "PENDING") {
			return { ...group, membershipStatus: "REQUESTED", userRole: null }
		}
		return { ...group, membershipStatus: "NONE", userRole: null }
	},

	listMembers: async (groupId: string): Promise<GroupMemberResponse[]> => {
		return db.groupMember.findMany({
			where: { groupId },
			orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
			select: groupMemberSelect,
		})
	},

	removeMember: async (adminId: string, groupId: string, targetUserId: string) => {
		const [adminMembership, targetMembership] = await Promise.all([
			db.groupMember.findUnique({
				where: { groupId_userId: { groupId, userId: adminId } },
				select: { role: true },
			}),
			db.groupMember.findUnique({
				where: { groupId_userId: { groupId, userId: targetUserId } },
				select: {
					id: true,
					user: { select: { email: true, name: true } },
				},
			}),
		])

		if (!adminMembership || adminMembership.role !== "ADMIN") {
			return { error: "FORBIDDEN" as const }
		}
		if (!targetMembership) return { error: "NOT_FOUND" as const }
		if (targetUserId === adminId) return { error: "CANNOT_REMOVE_SELF" as const }

		await db.groupMember.delete({ where: { id: targetMembership.id } })

		return {
			error: null,
			email: targetMembership.user.email,
			name: targetMembership.user.name,
		}
	},

	leave: async (userId: string, groupId: string) => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId } },
			select: { id: true, role: true },
		})

		if (!membership) return { error: "NOT_MEMBER" as const }

		if (membership.role === "ADMIN") {
			const adminCount = await db.groupMember.count({
				where: { groupId, role: "ADMIN" },
			})
			if (adminCount <= 1) {
				const memberCount = await db.groupMember.count({ where: { groupId } })
				if (memberCount > 1) return { error: "LAST_ADMIN" as const }
			}
		}

		await db.groupMember.delete({ where: { id: membership.id } })
		return { error: null }
	},

	listJoinRequests: async (
		adminId: string,
		groupId: string
	): Promise<
		| { error: "FORBIDDEN"; requests: null }
		| { error: null; requests: JoinRequestResponse[] }
	> => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId: adminId } },
			select: { role: true },
		})

		if (!membership || membership.role !== "ADMIN") {
			return { error: "FORBIDDEN", requests: null }
		}

		const requests = await db.groupJoinRequest.findMany({
			where: { groupId, status: "PENDING" },
			orderBy: { createdAt: "asc" },
			select: joinRequestSelect,
		})

		return { error: null, requests }
	},

	updateJoinRequest: async (
		adminId: string,
		groupId: string,
		requestId: string,
		action: "APPROVED" | "REJECTED"
	) => {
		const [adminMembership, request] = await Promise.all([
			db.groupMember.findUnique({
				where: { groupId_userId: { groupId, userId: adminId } },
				select: { role: true },
			}),
			db.groupJoinRequest.findUnique({
				where: { id: requestId },
				select: {
					id: true,
					groupId: true,
					userId: true,
					status: true,
					user: { select: { email: true, name: true } },
				},
			}),
		])

		if (!adminMembership || adminMembership.role !== "ADMIN") {
			return { error: "FORBIDDEN" as const }
		}
		if (!request || request.groupId !== groupId) return { error: "NOT_FOUND" as const }
		if (request.status !== "PENDING") return { error: "ALREADY_PROCESSED" as const }

		if (action === "APPROVED") {
			const group = await db.group.findUnique({
				where: { id: groupId },
				select: { maxMembers: true, _count: { select: { members: true } } },
			})
			if (!group) return { error: "NOT_FOUND" as const }
			if (group._count.members >= group.maxMembers) return { error: "FULL" as const }

			const user = await db.user.findUniqueOrThrow({
				where: { id: request.userId },
				select: { isPro: true },
			})
			const currentMemberships = await db.groupMember.count({
				where: { userId: request.userId },
			})
			if (currentMemberships >= joinLimitFor(user)) {
				return { error: "USER_GROUP_LIMIT" as const }
			}

			await db.$transaction([
				db.groupJoinRequest.update({
					where: { id: requestId },
					data: { status: "APPROVED" },
				}),
				db.groupMember.create({
					data: { groupId, userId: request.userId, role: "MEMBER" },
				}),
			])
		} else {
			await db.groupJoinRequest.update({
				where: { id: requestId },
				data: { status: "REJECTED" },
			})
		}

		return { error: null, email: request.user.email, name: request.user.name, action }
	},

	generateInvite: async (
		adminId: string,
		groupId: string,
		expiresIn: "7d" | "30d" | "90d" | "never"
	) => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId: adminId } },
			select: { role: true },
		})
		if (!membership || membership.role !== "ADMIN") {
			return { error: "FORBIDDEN" as const, inviteCode: null }
		}

		const inviteCode = crypto.randomUUID().replace(/-/g, "")
		const expiryDays = { "7d": 7, "30d": 30, "90d": 90 } as const
		const inviteExpiresAt =
			expiresIn === "never"
				? null
				: new Date(Date.now() + expiryDays[expiresIn] * 24 * 60 * 60 * 1000)

		await db.group.update({
			where: { id: groupId },
			data: { inviteCode, inviteExpiresAt },
		})

		return { error: null, inviteCode }
	},

	revokeInvite: async (adminId: string, groupId: string) => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId: adminId } },
			select: { role: true },
		})
		if (!membership || membership.role !== "ADMIN") {
			return { error: "FORBIDDEN" as const }
		}

		await db.group.update({
			where: { id: groupId },
			data: { inviteCode: null, inviteExpiresAt: null },
		})

		return { error: null }
	},

	joinByInvite: async (userId: string, inviteCode: string) => {
		const group = await db.group.findFirst({
			where: {
				inviteCode,
				isActive: true,
				OR: [{ inviteExpiresAt: null }, { inviteExpiresAt: { gt: new Date() } }],
			},
			select: {
				id: true,
				maxMembers: true,
				_count: { select: { members: true } },
			},
		})

		if (!group) return { error: "INVALID_CODE" as const, groupId: null, status: null }

		const existingMembership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId: group.id, userId } },
		})
		if (existingMembership) {
			return { error: null, status: "ALREADY_MEMBER" as const, groupId: group.id }
		}

		if (group._count.members >= group.maxMembers) {
			return { error: "FULL" as const, groupId: null, status: null }
		}

		const user = await db.user.findUniqueOrThrow({
			where: { id: userId },
			select: { isPro: true },
		})
		const memberships = await db.groupMember.count({ where: { userId } })
		if (memberships >= joinLimitFor(user)) {
			return { error: "GROUP_LIMIT" as const, groupId: null, status: null }
		}

		await db.groupMember.create({
			data: { groupId: group.id, userId, role: "MEMBER" },
		})

		return { error: null, status: "JOINED" as const, groupId: group.id }
	},

	updateSettings: async (adminId: string, groupId: string) => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId: adminId } },
			select: { role: true },
		})
		if (!membership || membership.role !== "ADMIN") {
			return { error: "FORBIDDEN" as const, group: null }
		}

		const group = await db.group.findUniqueOrThrow({
			where: { id: groupId },
			select: groupDetailSelect,
		})

		return {
			error: null,
			group: {
				...group,
				membershipStatus: "JOINED" as const,
				userRole: "ADMIN" as const,
			},
		}
	},
}
