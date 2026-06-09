import JoinApprovedEmail from "@/emails/join-approved"
import JoinExpiredEmail from "@/emails/join-expired"
import JoinRejectedEmail from "@/emails/join-rejected"
import JoinRequestEmail from "@/emails/join-request"
import RemovedFromGroupEmail from "@/emails/removed-from-group"
import { env } from "@/env"
import { MemberRole } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { resend } from "@/server/lib/email"
import { captureServerException } from "@/server/lib/sentry"

const BASE_URL = env.BETTER_AUTH_URL.replace(/\/$/, "")
const groupName = (slug: string) => `@${slug}`
const groupUrl = (groupId: string) => `${BASE_URL}/groups/${groupId}`
const browseUrl = () => `${BASE_URL}/groups`
const reviewUrl = (groupId: string) => `${BASE_URL}/groups/${groupId}/join-requests`

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
			const [requester, group, admins] = await Promise.all([
				db.user.findUniqueOrThrow({
					where: { id: requesterId },
					select: { name: true },
				}),
				fetchGroupSlug(groupId),
				db.groupMember.findMany({
					where: { groupId, role: MemberRole.ADMIN },
					select: {
						user: {
							select: { email: true, name: true, notifyGroupActivity: true },
						},
					},
				}),
			])
			if (!group) return

			await Promise.all(
				admins
					.filter((m) => m.user.notifyGroupActivity)
					.map((m) =>
						resend.emails.send({
							from: env.EMAIL_FROM,
							to: m.user.email,
							subject: `New join request for ${groupName(group.slug)}`,
							react: JoinRequestEmail({
								adminName: m.user.name,
								requesterName: requester.name,
								groupName: groupName(group.slug),
								reviewUrl: reviewUrl(groupId),
							}),
						})
					)
			)
		})
	},

	joinApproved: (groupId: string, requesterId: string) => {
		safeSend("join-approved", async () => {
			const [requester, group] = await Promise.all([
				fetchRequester(requesterId),
				fetchGroupSlug(groupId),
			])
			if (!requester || !group || !requester.notifyGroupActivity) return

			await resend.emails.send({
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

			await resend.emails.send({
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

			await resend.emails.send({
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

			await resend.emails.send({
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
}
