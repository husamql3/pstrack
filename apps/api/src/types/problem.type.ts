import { ProblemDifficulty, ProblemTopic, ProblemSource } from "generated/prisma/client";
import { z } from "zod";

export const insertProblemSchema = z.object({
	title: z.string("Title is required").min(1).max(20),
	slug: z.string("Slug is required").min(1).max(100),
	difficulty: z.enum(ProblemDifficulty, { message: "Difficulty is required" }),
	topics: z.enum(ProblemTopic, { message: "Topics are required" }),
	source: z.enum(ProblemSource, { message: "Source is required" }),
	roadmapIndex: z.number().optional(),
});
export type ProblemInsert = z.infer<typeof insertProblemSchema>;
export const updateProblemSchema = insertProblemSchema.partial();
export type ProblemUpdate = z.infer<typeof updateProblemSchema>;

// export const problemSelectSchema = createSelectSchema(problem);
// export type Problem = z.infer<typeof problemSelectSchema>;

// export const problemInsertSchema = createInsertSchema(problem);
// export type ProblemInsert = z.infer<typeof problemInsertSchema>;

// export const problemUpdateSchema = problemInsertSchema.partial();
// export type ProblemUpdate = z.infer<typeof problemUpdateSchema>;
