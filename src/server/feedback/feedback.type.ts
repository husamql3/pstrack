import { z } from "zod"

import type { Prisma } from "@/generated/prisma/client"
import { FeedbackCategory, FeedbackSource } from "@/generated/prisma/enums"

export const feedbackSelect = {
	id: true,
	source: true,
	category: true,
	description: true,
	reviewed: true,
	createdAt: true,
	user: { select: { id: true, username: true, name: true } },
	group: { select: { id: true, slug: true } },
} satisfies Prisma.FeedbackSelect

export type FeedbackResponse = Prisma.FeedbackGetPayload<{
	select: typeof feedbackSelect
}>

export const feedbackFormSchema = z.object({
	groupId: z.string().min(1, { error: "Group is required" }),
	category: z.enum(FeedbackCategory),
	description: z.string().max(1000).optional(),
})
export type FeedbackFormInput = z.infer<typeof feedbackFormSchema>

export const generalFeedbackFormSchema = z.object({
	description: z.string().max(1000, { error: "Max 1000 characters" }).optional(),
})
export type GeneralFeedbackFormInput = z.infer<typeof generalFeedbackFormSchema>

export { FeedbackCategory, FeedbackSource }
