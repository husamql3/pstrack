import { eq } from "drizzle-orm";

import { db } from "@/db";
import { problem as problemSchema } from "@/db/schema";
import { redis } from "@/lib/cache/client";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import type { Problem, ProblemInsert } from "@/types/problem.type";

export class ProblemRepository {
	async insert(problem: ProblemInsert): Promise<Problem | null> {
		const [inserted] = await db.insert(problemSchema).values(problem).returning();
		await redis.del(CACHE_KEYS.problems());
		return inserted ?? null;
	}

	async insertMany(problems: ProblemInsert[]): Promise<Problem[] | null> {
		const inserted = await db.insert(problemSchema).values(problems).returning();
		await redis.del(CACHE_KEYS.problems());
		return inserted ?? null;
	}

	async delete(id: string): Promise<void> {
		await db.delete(problemSchema).where(eq(problemSchema.id, id));

		await redis.del(CACHE_KEYS.problems());
	}

	async findById(id: string): Promise<Problem | null> {
		const cacheKey = CACHE_KEYS.problem(id);
		const cached = await redis.get<Problem>(cacheKey);
		if (cached) {
			return cached;
		}

		const problem = await db.query.problem.findFirst({ where: eq(problemSchema.id, id) });
		if (problem) {
			await redis.setex(cacheKey, CACHE_TTL.problem, problem);
		}

		return problem ?? null;
	}

	async findAll(): Promise<Problem[]> {
		const cacheKey = CACHE_KEYS.problems();
		const cached = await redis.get<Problem[]>(cacheKey);
		if (cached) {
			return cached;
		}

		const problems = await db.query.problem.findMany();
		if (problems) {
			await redis.setex(cacheKey, CACHE_TTL.problems, problems);
		}

		return problems ?? [];
	}
}
