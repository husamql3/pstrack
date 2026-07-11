import { readFile } from "node:fs/promises"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

const authMock = vi.hoisted(() => {
	process.env.BOT_NOTIFY_SECRET = "stress-bot-secret"

	return {
		getSession: vi.fn(),
		handler: vi.fn(async () => new Response("auth")),
		listSessions: vi.fn(),
		revokeOtherSessions: vi.fn(),
		revokeSession: vi.fn(),
	}
})

vi.mock("@/server/lib/auth", () => ({
	auth: {
		api: {
			getSession: authMock.getSession,
			listSessions: authMock.listSessions,
			revokeOtherSessions: authMock.revokeOtherSessions,
			revokeSession: authMock.revokeSession,
		},
		handler: authMock.handler,
	},
}))

vi.mock("@/server/lib/axiom", () => ({
	axiomLog: vi.fn(),
}))

vi.mock("@/server/lib/bot", () => ({
	notifyAdmin: vi.fn(),
}))

vi.mock("@/server/lib/email", () => ({
	sendEmail: vi.fn(async () => ({ id: "stress-email" })),
}))

vi.mock("@/server/lib/sentry", () => ({
	captureServerException: vi.fn(),
	initServerSentry: vi.fn(),
	ServerSentry: { flush: vi.fn() },
}))

import { app } from "@/server/app"
import {
	addMember,
	addRoadmapProblem,
	createDailyProblem,
	createGroup,
	createProblem,
	createUser,
	testDb,
} from "@/test/db"
import {
	expectAllowedResponse,
	expectCoreStressInvariants,
	expectNoRejectedStressWork,
	runConcurrent,
	stressRepetitions,
} from "@/test/stress"
import { STRESS_ENDPOINTS } from "@/test/stress-manifest"

type StressSessionUser = {
	id: string
	email: string
	name: string
	username: string | null
	isPro: boolean
	role: string | null
}

type StressContext = {
	admin: StressSessionUser
	pro: StressSessionUser
	user: StressSessionUser
	pauseUser: StressSessionUser
	outsider: StressSessionUser
	target: StressSessionUser
	removable: StressSessionUser
	publicGroupId: string
	privateGroupId: string
	startableGroupId: string
	deletableGroupId: string
	inviteCode: string
	joinRequestId: string
	transferRequestId: string
	feedbackId: string
	problemId: string
	deletableProblemId: string
}

type StressScenario = {
	key: { method: string; path: string }
	method: string
	path: string
	userId?: string
	headers?: Record<string, string>
	body?: unknown | ((index: number) => unknown)
	allowedStatuses: number[]
}

const sessions = new Map<string, StressSessionUser>()
let fontRegular: Buffer
let fontBold: Buffer

const startOfUtcDay = (date: Date) =>
	new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const toArrayBuffer = (buffer: Buffer) => Uint8Array.from(buffer).buffer

const registerSession = (user: StressSessionUser) => {
	sessions.set(user.id, user)
	return user
}

const sessionUserFromDb = (user: Awaited<ReturnType<typeof createUser>>) =>
	registerSession({
		id: user.id,
		email: user.email,
		name: user.name,
		username: user.username,
		isPro: user.isPro,
		role: user.role,
	})

const jsonResponse = (body: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(body), {
		...init,
		headers: { "content-type": "application/json", ...init?.headers },
	})

const seedStressContext = async (): Promise<StressContext> => {
	const today = startOfUtcDay(new Date())
	const tomorrow = new Date(today.getTime() + 86_400_000)

	const admin = sessionUserFromDb(
		await createUser({
			id: "stress-admin",
			email: "stress-admin@example.com",
			username: "stress_admin",
			role: "admin",
			isPro: true,
			leetcodeHandle: "stressadmin",
		})
	)
	const pro = sessionUserFromDb(
		await createUser({
			id: "stress-pro",
			email: "stress-pro@example.com",
			username: "stress_pro",
			isPro: true,
			leetcodeHandle: "stresspro",
		})
	)
	const user = sessionUserFromDb(
		await createUser({
			id: "stress-user",
			email: "stress-user@example.com",
			username: "stress_user",
			leetcodeHandle: "stressuser",
			codeforcesHandle: "tourist",
		})
	)
	const pauseUser = sessionUserFromDb(
		await createUser({
			id: "stress-pause",
			email: "stress-pause@example.com",
			username: "stress_pause",
			leetcodeHandle: "stresspause",
		})
	)
	const outsider = sessionUserFromDb(
		await createUser({
			id: "stress-outsider",
			email: "stress-outsider@example.com",
			username: "stress_outsider",
			isPro: true,
			leetcodeHandle: "stressoutsider",
		})
	)
	const target = sessionUserFromDb(
		await createUser({
			id: "stress-target",
			email: "stress-target@example.com",
			username: "stress_target",
			leetcodeHandle: "stresstarget",
		})
	)
	const removable = sessionUserFromDb(
		await createUser({
			id: "stress-removable",
			email: "stress-removable@example.com",
			username: "stress_removable",
			leetcodeHandle: "stressremovable",
		})
	)
	const pendingUser = await createUser({
		id: "stress-pending",
		email: "stress-pending@example.com",
		username: "stress_pending",
	})
	const transferUser = await createUser({
		id: "stress-transfer",
		email: "stress-transfer@example.com",
		username: "stress_transfer",
	})

	const problem = await createProblem({
		id: "stress-problem",
		slug: "stress-two-sum",
		title: "Stress Two Sum",
		roadmapIndex: 10_001,
		neetcode250: true,
	})
	await addRoadmapProblem({ problemId: problem.id, position: 1, topic: problem.topic })

	const pauseProblem = await createProblem({
		id: "stress-pause-problem",
		slug: "stress-pause-problem",
		title: "Stress Pause Problem",
		roadmapIndex: 10_002,
		neetcode250: true,
	})
	await addRoadmapProblem({
		problemId: pauseProblem.id,
		position: 2,
		topic: pauseProblem.topic,
	})

	const deletableProblem = await createProblem({
		id: "stress-deletable-problem",
		slug: "stress-deletable-problem",
		title: "Stress Deletable Problem",
		roadmapIndex: 10_003,
		neetcode250: true,
	})
	await addRoadmapProblem({
		problemId: deletableProblem.id,
		position: 3,
		topic: deletableProblem.topic,
	})

	const publicGroup = await createGroup({
		id: "stress-public-group",
		slug: "stress-public-group",
		creatorId: admin.id,
		maxMembers: 50,
		isStarted: true,
	})
	const pauseGroup = await createGroup({
		id: "stress-pause-group",
		slug: "stress-pause-group",
		creatorId: admin.id,
		maxMembers: 50,
		isStarted: true,
	})
	const privateGroup = await createGroup({
		id: "stress-private-group",
		slug: "stress-private-group",
		type: "PRIVATE",
		creatorId: admin.id,
		maxMembers: 50,
		inviteCode: "stress-invite",
		inviteExpiresAt: tomorrow,
		isStarted: true,
	})
	const startableGroup = await createGroup({
		id: "stress-startable-group",
		slug: "stress-startable-group",
		creatorId: admin.id,
		maxMembers: 50,
		isStarted: false,
	})
	const deletableGroup = await createGroup({
		id: "stress-deletable-group",
		slug: "stress-deletable-group",
		creatorId: admin.id,
		maxMembers: 50,
		isStarted: false,
	})

	await Promise.all([
		addMember(publicGroup.id, admin.id),
		addMember(publicGroup.id, user.id),
		addMember(publicGroup.id, removable.id),
		addMember(pauseGroup.id, pauseUser.id),
		addMember(privateGroup.id, admin.id),
		addMember(privateGroup.id, target.id),
	])

	await Promise.all([
		createDailyProblem({
			groupId: publicGroup.id,
			problemId: problem.id,
			assignedDate: today,
		}),
		createDailyProblem({
			groupId: pauseGroup.id,
			problemId: pauseProblem.id,
			assignedDate: today,
		}),
	])

	const joinRequest = await testDb.groupJoinRequest.create({
		data: {
			groupId: publicGroup.id,
			userId: pendingUser.id,
			status: "PENDING",
			expiresAt: tomorrow,
		},
	})
	const transferRequest = await testDb.groupJoinRequest.create({
		data: {
			groupId: startableGroup.id,
			userId: transferUser.id,
			status: "PENDING",
			expiresAt: tomorrow,
		},
	})

	const feedback = await testDb.feedback.create({
		data: {
			userId: user.id,
			groupId: publicGroup.id,
			category: "BUG",
			description: "Seed feedback",
		},
	})

	await testDb.featureFlag.create({
		data: {
			key: "stress-existing-flag",
			enabled: false,
			description: "Existing stress flag",
		},
	})
	await testDb.systemConfig.create({
		data: {
			key: "stress-existing-config",
			value: { enabled: true },
			description: "Existing stress config",
		},
	})

	return {
		admin,
		pro,
		user,
		pauseUser,
		outsider,
		target,
		removable,
		publicGroupId: publicGroup.id,
		privateGroupId: privateGroup.id,
		startableGroupId: startableGroup.id,
		deletableGroupId: deletableGroup.id,
		inviteCode: "stress-invite",
		joinRequestId: joinRequest.id,
		transferRequestId: transferRequest.id,
		feedbackId: feedback.id,
		problemId: problem.id,
		deletableProblemId: deletableProblem.id,
	}
}

const createEndpointScenarios = (ctx: StressContext): StressScenario[] => [
	{
		key: { method: "ALL", path: "/api/v3/auth/*" },
		method: "GET",
		path: "/api/v3/auth/session",
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/health" },
		method: "GET",
		path: "/api/v3/health",
		allowedStatuses: [200, 503],
	},
	{
		key: { method: "GET", path: "/api/v3/openapi" },
		method: "GET",
		path: "/api/v3/openapi",
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/openapi/json" },
		method: "GET",
		path: "/api/v3/openapi/json",
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/og/" },
		method: "GET",
		path: "/api/v3/og/?title=Stress%20Testing%20PStrack&subtitle=Invariant%20check",
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/magic-link" },
		method: "GET",
		path: "/api/v3/magic-link?token=%3C/script%3E&callbackURL=https://evil.example",
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/users/check-username" },
		method: "POST",
		path: "/api/v3/users/check-username",
		body: { username: "stress_candidate" },
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/users/validate-leetcode" },
		method: "POST",
		path: "/api/v3/users/validate-leetcode",
		body: { handle: "stressuser" },
		allowedStatuses: [200, 502],
	},
	{
		key: { method: "POST", path: "/api/v3/users/validate-codeforces" },
		method: "POST",
		path: "/api/v3/users/validate-codeforces",
		body: { handle: "tourist" },
		allowedStatuses: [200, 502],
	},
	{
		key: { method: "GET", path: "/api/v3/users/count" },
		method: "GET",
		path: "/api/v3/users/count",
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/users/me" },
		method: "GET",
		path: "/api/v3/users/me",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/users/me/username" },
		method: "PATCH",
		path: "/api/v3/users/me/username",
		userId: ctx.outsider.id,
		body: { username: "stress_renamed" },
		allowedStatuses: [200, 409, 429],
	},
	{
		key: { method: "PATCH", path: "/api/v3/users/me/profile" },
		method: "PATCH",
		path: "/api/v3/users/me/profile",
		userId: ctx.user.id,
		body: { name: "Stress User", bio: "Under pressure", isPublic: true },
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/users/me/handles" },
		method: "PATCH",
		path: "/api/v3/users/me/handles",
		userId: ctx.user.id,
		body: { leetcodeHandle: "stressuser", codeforcesHandle: "tourist" },
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/users/me/notifications" },
		method: "PATCH",
		path: "/api/v3/users/me/notifications",
		userId: ctx.user.id,
		body: {
			notifyDailyProblem: true,
			notifyAchievements: false,
			notifyGroupActivity: true,
		},
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/users/me/sessions" },
		method: "GET",
		path: "/api/v3/users/me/sessions",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/users/me/sessions/others" },
		method: "DELETE",
		path: "/api/v3/users/me/sessions/others",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/users/me/sessions/:id" },
		method: "DELETE",
		path: "/api/v3/users/me/sessions/stress-session",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/users/:username" },
		method: "GET",
		path: "/api/v3/users/stress_user",
		userId: ctx.user.id,
		allowedStatuses: [200, 404],
	},
	{
		key: { method: "GET", path: "/api/v3/users/:username/heatmap" },
		method: "GET",
		path: "/api/v3/users/stress_user/heatmap",
		allowedStatuses: [200, 404],
	},
	{
		key: { method: "POST", path: "/api/v3/groups/join-by-invite" },
		method: "POST",
		path: "/api/v3/groups/join-by-invite",
		userId: ctx.outsider.id,
		body: { inviteCode: ctx.inviteCode },
		allowedStatuses: [200, 403, 409],
	},
	{
		key: { method: "GET", path: "/api/v3/groups/" },
		method: "GET",
		path: "/api/v3/groups/",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/groups/" },
		method: "POST",
		path: "/api/v3/groups/",
		userId: ctx.pro.id,
		body: {},
		allowedStatuses: [200, 403],
	},
	{
		key: { method: "GET", path: "/api/v3/groups/:id" },
		method: "GET",
		path: `/api/v3/groups/${ctx.publicGroupId}`,
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/groups/:id/join" },
		method: "POST",
		path: `/api/v3/groups/${ctx.publicGroupId}/join`,
		userId: ctx.target.id,
		allowedStatuses: [200, 403, 409],
	},
	{
		key: { method: "POST", path: "/api/v3/groups/:id/leave" },
		method: "POST",
		path: `/api/v3/groups/${ctx.privateGroupId}/leave`,
		userId: ctx.target.id,
		allowedStatuses: [200, 400],
	},
	{
		key: { method: "GET", path: "/api/v3/groups/:id/members" },
		method: "GET",
		path: `/api/v3/groups/${ctx.publicGroupId}/members`,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/groups/:id/today-activity" },
		method: "GET",
		path: `/api/v3/groups/${ctx.publicGroupId}/today-activity`,
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/groups/:id/problems" },
		method: "GET",
		path: `/api/v3/groups/${ctx.publicGroupId}/problems?range=7d`,
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/problems/today" },
		method: "GET",
		path: "/api/v3/problems/today",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/problems/roadmap" },
		method: "GET",
		path: "/api/v3/problems/roadmap?roadmap=NC250",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/problems/today/solve" },
		method: "POST",
		path: "/api/v3/problems/today/solve",
		userId: ctx.user.id,
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "POST", path: "/api/v3/problems/today/pause" },
		method: "POST",
		path: "/api/v3/problems/today/pause",
		userId: ctx.pauseUser.id,
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "GET", path: "/api/v3/badges/me" },
		method: "GET",
		path: "/api/v3/badges/me",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/feedbacks/prompt" },
		method: "GET",
		path: `/api/v3/feedbacks/prompt?groupId=${ctx.publicGroupId}`,
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/feedbacks/" },
		method: "POST",
		path: "/api/v3/feedbacks/",
		userId: ctx.user.id,
		body: {
			groupId: ctx.publicGroupId,
			category: "BUG",
			description: "Stress feedback",
		},
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "POST", path: "/api/v3/feedbacks/general" },
		method: "POST",
		path: "/api/v3/feedbacks/general",
		userId: ctx.user.id,
		body: { description: "General stress feedback" },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/feedbacks/" },
		method: "GET",
		path: "/api/v3/feedbacks/",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/feedbacks/:id/reviewed" },
		method: "PATCH",
		path: `/api/v3/feedbacks/${ctx.feedbackId}/reviewed`,
		userId: ctx.admin.id,
		body: { reviewed: true },
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/internal/bot/join-requests/:requestId" },
		method: "PATCH",
		path: `/api/v3/internal/bot/join-requests/${ctx.joinRequestId}`,
		headers: { Authorization: "Bearer stress-bot-secret" },
		body: { action: "APPROVED" },
		allowedStatuses: [200, 409],
	},
	{
		key: {
			method: "POST",
			path: "/api/v3/internal/bot/join-requests/:requestId/transfer",
		},
		method: "POST",
		path: `/api/v3/internal/bot/join-requests/${ctx.transferRequestId}/transfer`,
		headers: { Authorization: "Bearer stress-bot-secret" },
		body: { targetGroupId: ctx.privateGroupId },
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "GET", path: "/api/v3/internal/bot/groups" },
		method: "GET",
		path: "/api/v3/internal/bot/groups",
		headers: { Authorization: "Bearer stress-bot-secret" },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/internal/bot/join-requests" },
		method: "GET",
		path: "/api/v3/internal/bot/join-requests",
		headers: { Authorization: "Bearer stress-bot-secret" },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/internal/bot" },
		method: "GET",
		path: "/api/v3/internal/bot",
		headers: { Authorization: "Bearer stress-bot-secret" },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/leaderboard/global" },
		method: "GET",
		path: "/api/v3/leaderboard/global?period=week",
		userId: ctx.pro.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/leaderboard/groups/:id" },
		method: "GET",
		path: `/api/v3/leaderboard/groups/${ctx.publicGroupId}?period=week`,
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/leaderboard/my-groups" },
		method: "GET",
		path: "/api/v3/leaderboard/my-groups",
		userId: ctx.user.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/stats" },
		method: "GET",
		path: "/api/v3/admin/stats",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/audit" },
		method: "GET",
		path: "/api/v3/admin/audit?limit=10",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/feature-flags" },
		method: "GET",
		path: "/api/v3/admin/feature-flags",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/feature-flags" },
		method: "POST",
		path: "/api/v3/admin/feature-flags",
		userId: ctx.admin.id,
		body: { key: "stress-created-flag", enabled: true, description: "Stress" },
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "PATCH", path: "/api/v3/admin/feature-flags/:key" },
		method: "PATCH",
		path: "/api/v3/admin/feature-flags/stress-existing-flag",
		userId: ctx.admin.id,
		body: { enabled: true },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/system-config" },
		method: "GET",
		path: "/api/v3/admin/system-config",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "PUT", path: "/api/v3/admin/system-config" },
		method: "PUT",
		path: "/api/v3/admin/system-config",
		userId: ctx.admin.id,
		body: {
			key: "stress-existing-config",
			value: { enabled: true, updatedBy: "stress" },
			description: "Stress config",
		},
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/emails/templates" },
		method: "GET",
		path: "/api/v3/admin/emails/templates",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/emails/send" },
		method: "POST",
		path: "/api/v3/admin/emails/send",
		userId: ctx.admin.id,
		body: { template: "daily-problem", toUserId: ctx.user.id, props: {} },
		allowedStatuses: [200, 400],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/users/" },
		method: "GET",
		path: "/api/v3/admin/users/?limit=10",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/users/:id" },
		method: "GET",
		path: `/api/v3/admin/users/${ctx.user.id}`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/users/:id/points-history" },
		method: "GET",
		path: `/api/v3/admin/users/${ctx.user.id}/points-history?limit=10`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/admin/users/:id/ban" },
		method: "PATCH",
		path: `/api/v3/admin/users/${ctx.target.id}/ban`,
		userId: ctx.admin.id,
		body: { banned: true, reason: "Stress ban" },
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/users/:id/points" },
		method: "POST",
		path: `/api/v3/admin/users/${ctx.target.id}/points`,
		userId: ctx.admin.id,
		body: { delta: 1, reason: "Stress adjustment" },
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/users/:id/pro" },
		method: "POST",
		path: `/api/v3/admin/users/${ctx.target.id}/pro`,
		userId: ctx.admin.id,
		body: { grant: true, expiresAt: null, reason: "Stress grant" },
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/users/:id/impersonate-audit" },
		method: "POST",
		path: `/api/v3/admin/users/${ctx.target.id}/impersonate-audit`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: {
			method: "POST",
			path: "/api/v3/admin/users/:id/impersonate-end-audit",
		},
		method: "POST",
		path: `/api/v3/admin/users/${ctx.target.id}/impersonate-end-audit`,
		userId: ctx.admin.id,
		body: { durationMs: 10 },
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/groups/" },
		method: "POST",
		path: "/api/v3/admin/groups/",
		userId: ctx.admin.id,
		body: { type: "PUBLIC", roadmap: "NC250", maxMembers: 30 },
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/groups/" },
		method: "GET",
		path: "/api/v3/admin/groups/?limit=10",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/groups/pending-requests" },
		method: "GET",
		path: "/api/v3/admin/groups/pending-requests",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/groups/:id" },
		method: "GET",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/groups/:id/members" },
		method: "GET",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/members`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/admin/groups/:id/members/:userId" },
		method: "DELETE",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/members/${ctx.removable.id}`,
		userId: ctx.admin.id,
		allowedStatuses: [200, 404],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/groups/:id/join-requests" },
		method: "GET",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/join-requests`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: {
			method: "PATCH",
			path: "/api/v3/admin/groups/:id/join-requests/:requestId",
		},
		method: "PATCH",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/join-requests/${ctx.joinRequestId}`,
		userId: ctx.admin.id,
		body: { action: "APPROVED" },
		allowedStatuses: [200, 404, 409],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/groups/:id/invite" },
		method: "POST",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/invite`,
		userId: ctx.admin.id,
		body: { expiresIn: "7d" },
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/admin/groups/:id/invite" },
		method: "DELETE",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/invite`,
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "PATCH", path: "/api/v3/admin/groups/:id/start" },
		method: "PATCH",
		path: `/api/v3/admin/groups/${ctx.startableGroupId}/start`,
		userId: ctx.admin.id,
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "PATCH", path: "/api/v3/admin/groups/:id/freeze" },
		method: "PATCH",
		path: `/api/v3/admin/groups/${ctx.publicGroupId}/freeze`,
		userId: ctx.admin.id,
		body: { frozen: true },
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/admin/groups/:id" },
		method: "DELETE",
		path: `/api/v3/admin/groups/${ctx.deletableGroupId}`,
		userId: ctx.admin.id,
		allowedStatuses: [200, 404],
	},
	{
		key: { method: "GET", path: "/api/v3/admin/problems/" },
		method: "GET",
		path: "/api/v3/admin/problems/?limit=10",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/problems/" },
		method: "POST",
		path: "/api/v3/admin/problems/",
		userId: ctx.admin.id,
		body: (index: number) => ({
			slug: `stress-created-problem-${index}`,
			title: `Stress Created Problem ${index}`,
			difficulty: "EASY",
			topic: "Stress",
			leetcodeId: null,
			neetcode250: false,
			neetcode150: false,
			blind75: false,
		}),
		allowedStatuses: [200, 409],
	},
	{
		key: { method: "PATCH", path: "/api/v3/admin/problems/:id" },
		method: "PATCH",
		path: `/api/v3/admin/problems/${ctx.problemId}`,
		userId: ctx.admin.id,
		body: { title: "Stress Two Sum Updated" },
		allowedStatuses: [200],
	},
	{
		key: { method: "DELETE", path: "/api/v3/admin/problems/:id" },
		method: "DELETE",
		path: `/api/v3/admin/problems/${ctx.deletableProblemId}`,
		userId: ctx.admin.id,
		allowedStatuses: [200, 404, 409],
	},
	{
		key: { method: "POST", path: "/api/v3/admin/problems/seed" },
		method: "POST",
		path: "/api/v3/admin/problems/seed",
		userId: ctx.admin.id,
		allowedStatuses: [200],
	},
]

const makeRequest = (scenario: StressScenario, index: number) => {
	const headers = new Headers(scenario.headers ?? {})
	if (scenario.userId) headers.set("x-test-user-id", scenario.userId)

	let body: BodyInit | undefined
	const rawBody =
		typeof scenario.body === "function" ? scenario.body(index) : scenario.body
	if (rawBody !== undefined) {
		headers.set("content-type", "application/json")
		body = JSON.stringify(rawBody)
	}

	return new Request(`https://stress.test${scenario.path}`, {
		method: scenario.method,
		headers,
		body,
	})
}

describe("API stress suite", () => {
	beforeAll(async () => {
		fontRegular = await readFile(
			new URL("../../../public/fonts/geist-400.woff", import.meta.url)
		)
		fontBold = await readFile(
			new URL("../../../public/fonts/geist-600.woff", import.meta.url)
		)
	})

	beforeEach(() => {
		sessions.clear()
		authMock.handler.mockImplementation(async () => new Response("auth"))
		authMock.getSession.mockImplementation(async ({ headers }) => {
			const userId = headers.get("x-test-user-id")
			const user = userId ? sessions.get(userId) : null
			if (!user) return null

			return {
				user,
				session: {
					id: `session-${user.id}`,
					token: `token-${user.id}`,
					userId: user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					expiresAt: new Date(Date.now() + 86_400_000),
				},
			}
		})
		authMock.listSessions.mockResolvedValue([
			{
				id: "stress-session",
				createdAt: new Date(),
				updatedAt: new Date(),
				expiresAt: new Date(Date.now() + 86_400_000),
				ipAddress: "127.0.0.1",
				userAgent: "stress",
			},
		])
		authMock.revokeOtherSessions.mockResolvedValue({ success: true })
		authMock.revokeSession.mockResolvedValue({ success: true })

		vi.stubGlobal(
			"fetch",
			vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
				const url = String(input)
				if (url.endsWith("/fonts/geist-400.woff")) {
					return new Response(toArrayBuffer(fontRegular))
				}
				if (url.endsWith("/fonts/geist-600.woff")) {
					return new Response(toArrayBuffer(fontBold))
				}
				if (url.includes("leetcode.com/graphql")) {
					const body = init?.body ? JSON.parse(String(init.body)) : {}
					if (String(body.query ?? "").includes("matchedUser")) {
						return jsonResponse({ data: { matchedUser: { username: "stressuser" } } })
					}
					return jsonResponse({
						data: {
							recentAcSubmissionList: [
								{
									titleSlug: "stress-two-sum",
									timestamp: String(Math.floor(Date.now() / 1000)),
								},
							],
						},
					})
				}
				if (url.includes("codeforces.com/api/user.info")) {
					return jsonResponse({ status: "OK" })
				}
				return new Response("not found", { status: 404 })
			})
		)
	})

	it("keeps every endpoint inside its allowed response envelope under representative pressure", async () => {
		const ctx = await seedStressContext()
		const scenarios = createEndpointScenarios(ctx)
		const expectedKeys = STRESS_ENDPOINTS.map(({ method, path }) => ({
			method,
			path,
		}))
		const actualKeys = scenarios.map((scenario) => scenario.key)

		expect(actualKeys).toEqual(expectedKeys)

		const repetitions = stressRepetitions(2)
		for (const scenario of scenarios) {
			const results = await runConcurrent(repetitions, async (index) => {
				const response = await app.handle(makeRequest(scenario, index))
				await expectAllowedResponse(response, scenario.allowedStatuses)
			})
			expectNoRejectedStressWork(results)
		}

		await expectCoreStressInvariants()
	})
})
