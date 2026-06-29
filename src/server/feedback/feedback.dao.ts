import { type FeedbackCategory, GroupMemberStatus } from "@/generated/prisma/enums"
import { db } from "@/server/lib/db"
import { feedbackSelect } from "./feedback.type"

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const feedbackDao = {
	shouldShowPrompt: async (
		userId: string,
		groupId: string
	): Promise<{ shouldShow: boolean }> => {
		const membership = await db.groupMember.findUnique({
			where: { groupId_userId: { groupId, userId } },
			select: { joinedAt: true, status: true },
		})
		if (!membership || membership.status !== GroupMemberStatus.ACTIVE) {
			return { shouldShow: false }
		}
		const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
		if (membership.joinedAt > sevenDaysAgo) return { shouldShow: false }

		const existing = await db.feedback.findUnique({
			where: { userId_groupId: { userId, groupId } },
			select: { id: true },
		})
		return { shouldShow: !existing }
	},

	submit: async (
		userId: string,
		groupId: string,
		category: FeedbackCategory,
		description?: string
	) =>
		db.feedback.create({
			data: { userId, groupId, category, description: description ?? null },
			select: feedbackSelect,
		}),

	list: async (groupId?: string, reviewed?: boolean) =>
		db.feedback.findMany({
			where: {
				...(groupId ? { groupId } : {}),
				...(reviewed !== undefined ? { reviewed } : {}),
			},
			select: feedbackSelect,
			orderBy: [{ reviewed: "asc" }, { createdAt: "desc" }],
		}),

	markReviewed: async (id: string, reviewed: boolean) =>
		db.feedback.update({
			where: { id },
			data: { reviewed },
			select: feedbackSelect,
		}),
}
