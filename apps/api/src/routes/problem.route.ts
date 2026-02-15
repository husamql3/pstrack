import type { Problem } from "generated/prisma/client";
import { ProblemDifficulty, ProblemTopic, ProblemSource } from "generated/prisma/client";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { db } from "@/db";
import { redis } from "@/lib/cache/client";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import { success } from "@/lib/response";
import { validator } from "@/lib/validator";
import { log } from "@/middlewares/logger";
import { createRouter } from "@/utils/create-app";

export const insertProblemSchema = z.object({
	title: z.string("Title is required").min(1).max(20),
	slug: z.string("Slug is required").min(1).max(100),
	difficulty: z.enum(ProblemDifficulty, { message: "Difficulty is required" }),
	topics: z.enum(ProblemTopic, { message: "Topics are required" }),
	source: z.enum(ProblemSource, { message: "Source is required" }),
	roadmapIndex: z.number("Roadmap index is required"),
});

export type ProblemInsert = z.infer<typeof insertProblemSchema>;

export async function findAllProblems(): Promise<Problem[]> {
	log.debug("Finding all problems");
	const cacheKey = CACHE_KEYS.problems();
	const cached = await redis.get<Problem[]>(cacheKey);
	if (cached) {
		log.debug("Problems found in cache", { cached });
		return cached;
	}

	const problems = await db.problem.findMany();
	if (problems) {
		await redis.setex(cacheKey, CACHE_TTL.problems, problems);
		log.debug("Problems found in database", { problems });
		return problems;
	}

	return [];
}

export async function findProblemById(id: string): Promise<Problem | null> {
	log.debug("Finding problem by id", { id });
	const cacheKey = CACHE_KEYS.problem(id);
	const cached = await redis.get<Problem>(cacheKey);
	if (cached) {
		log.debug("Problem found in cache", { cached });
		return cached;
	}

	const problem = await db.problem.findFirst({ where: { id } });
	if (problem) {
		await redis.setex(cacheKey, CACHE_TTL.problem, problem);
		log.debug("Problem found in database", { problem });
		return problem;
	}

	throw new HTTPException(404, { message: "Problem not found" });
}

export async function insertProblem(problemData: ProblemInsert): Promise<Problem> {
	log.debug("Inserting problem", { problem: problemData });

	// Check if problem with same slug already exists
	const existing = await db.problem.findUnique({ where: { slug: problemData.slug } });
	if (existing) {
		log.debug("Problem with slug already exists", { slug: problemData.slug });
		throw new HTTPException(409, { message: `Problem with slug "${problemData.slug}" already exists` });
	}

	const newProblem = await db.problem.create({ data: problemData });
	log.debug("Problem inserted", { problem: newProblem });

	// Cache the new problem
	await redis.setex(CACHE_KEYS.problem(newProblem.id), CACHE_TTL.problem, newProblem);
	log.debug("Problem cached", { problem: newProblem });

	// Invalidate the problems list cache since we added a new problem
	await redis.del(CACHE_KEYS.problems());
	log.debug("Problems list cache invalidated");

	return newProblem;
}

export const problemRouter = createRouter()
	.get("/", async (c) => {
		const problems = await findAllProblems();
		return success(c, problems, 200);
	})
	.get("/:id", validator("param", z.object({ id: z.uuid() })), async (c) => {
		const { id } = c.req.valid("param");
		const problem = await findProblemById(id);
		return success(c, problem, 200);
	})
	.post("/", validator("json", insertProblemSchema), async (c) => {
		const problem = await insertProblem(c.req.valid("json"));
		return success(c, problem, 201);
	});
