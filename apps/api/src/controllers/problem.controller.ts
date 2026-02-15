import { log } from "@/middlewares/logger";
import { ProblemService } from "@/services/problem.service";
import type { ProblemInsert } from "@/types/problem.type";

export async function insertProblem(problem: ProblemInsert) {
	const problemService = new ProblemService();
	const newProblem = await problemService.insert(problem);
	log.debug("Problem inserted", { problem: newProblem });
	return newProblem;
}

export async function insertManyProblems(problems: ProblemInsert[]) {
	const problemService = new ProblemService();
	const newProblems = await problemService.insertMany(problems);
	log.debug("Problems inserted", { problems: newProblems });
	return newProblems;
}
