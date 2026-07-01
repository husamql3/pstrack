import InactivityWarningEmail from "@/emails/inactivity-warning"
import JoinApprovedEmail from "@/emails/join-approved"
import JoinExpiredEmail from "@/emails/join-expired"
import JoinRejectedEmail from "@/emails/join-rejected"
import RemovedFromGroupEmail from "@/emails/removed-from-group"
import { env } from "@/env"
import { GroupType } from "@/generated/prisma/enums"
import { notifyAdmin } from "@/server/lib/bot"
import { db } from "@/server/lib/db"
import { sendEmail } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")
const groupName = (slug: string) => `@${slug}`
const groupUrl = (groupId: string) => `${BASE_URL}/groups/${groupId}`
const browseUrl = () => `${BASE_URL}/groups`
const dashboardUrl = () => `${BASE_URL}/dashboard`

const safeSend = (label: string, send: () => Promise<unknown>) => {
	send().catch((err) => captureServerException(err, { tag: `email:${label}` }))
}

const fetchRequester = (userId: string) =>
	db.user.findUnique({
		where: { id: userId },
		select: { email: true, name: true, notifyGroupActivity: true },
	})

const fetchGroupSlug = (groupId: string) =>
	db.group.findUnique({
		where: { id: groupId },
		select: { slug: true },
	})

export const groupNotifications = {
	joinRequested: (groupId: string, requesterId: string) => {
		safeSend("join-request", async () => {
			const [requester, group] = await Promise.all([
				db.user.findUniqueOrThrow({
					where: { id: requesterId },
					select: { name: true, email: true },
				}),
				fetchGroupSlug(groupId),
			])
			if (!group) return

			notifyAdmin("join.requested", {
				groupName: groupName(group.slug),
				userEmail: requester.email,
				userName: requester.name,
				requestedAt: new Date().toISOString(),
			})
		})
	},

	joinApproved: (groupId: string, requesterId: string) => {
		safeSend("join-approved", async () => {
			const [requester, group] = await Promise.all([
				fetchRequester(requesterId),
				fetchGroupSlug(groupId),
			])
			if (!requester || !group || !requester.notifyGroupActivity) return

			await sendEmail({
				from: env.EMAIL_FROM,
				to: requester.email,
				subject: `You've been approved to join ${groupName(group.slug)}`,
				react: JoinApprovedEmail({
					name: requester.name,
					groupName: groupName(group.slug),
					groupUrl: groupUrl(groupId),
				}),
			})
		})
	},

	joinRejected: (groupId: string, requesterId: string) => {
		safeSend("join-rejected", async () => {
			const [requester, group] = await Promise.all([
				fetchRequester(requesterId),
				fetchGroupSlug(groupId),
			])
			if (!requester || !group || !requester.notifyGroupActivity) return

			await sendEmail({
				from: env.EMAIL_FROM,
				to: requester.email,
				subject: `Your request to join ${groupName(group.slug)} was not approved`,
				react: JoinRejectedEmail({
					name: requester.name,
					groupName: groupName(group.slug),
					browseUrl: browseUrl(),
				}),
			})
		})
	},

	joinExpired: async (groupId: string, requesterId: string) => {
		try {
			const [requester, group] = await Promise.all([
				fetchRequester(requesterId),
				fetchGroupSlug(groupId),
			])
			if (!requester || !group || !requester.notifyGroupActivity) return

			await sendEmail({
				from: env.EMAIL_FROM,
				to: requester.email,
				subject: `Your request to join ${groupName(group.slug)} expired`,
				react: JoinExpiredEmail({
					name: requester.name,
					groupName: groupName(group.slug),
					browseUrl: browseUrl(),
				}),
			})
		} catch (err) {
			captureServerException(err, { tag: "email:join-expired" })
		}
	},

	memberRemoved: (groupId: string, removedUserId: string) => {
		safeSend("removed-from-group", async () => {
			const [user, group] = await Promise.all([
				fetchRequester(removedUserId),
				fetchGroupSlug(groupId),
			])
			if (!user || !group || !user.notifyGroupActivity) return

			await sendEmail({
				from: env.EMAIL_FROM,
				to: user.email,
				subject: `You've been removed from ${groupName(group.slug)}`,
				react: RemovedFromGroupEmail({
					name: user.name,
					groupName: groupName(group.slug),
					browseUrl: browseUrl(),
				}),
			})
		})
	},

	inactivityWarning: (
		groupId: string,
		userId: string,
		missedCount: number,
		groupType: GroupType
	) => {
		safeSend("inactivity-warning", async () => {
			const [user, group] = await Promise.all([
				fetchRequester(userId),
				fetchGroupSlug(groupId),
			])
			if (!user || !group || !user.notifyGroupActivity) return

			await sendEmail({
				from: env.EMAIL_FROM,
				to: user.email,
				subject:
					groupType === GroupType.PUBLIC
						? `Solve or pause next to stay in ${groupName(group.slug)}`
						: `${missedCount} missed days in ${groupName(group.slug)}`,
				react: InactivityWarningEmail({
					name: user.name,
					groupName: groupName(group.slug),
					missedCount,
					groupType,
					dashboardUrl: dashboardUrl(),
				}),
			})
		})
	},
}
