import { log } from "@/middlewares/logger";
import { ProblemRepository } from "@/repositories/problem.repository";
import type { Problem, ProblemInsert } from "@/types/problem.type";

export class ProblemService {
	private readonly problemRepo: ProblemRepository;

	constructor() {
		this.problemRepo = new ProblemRepository();
	}

	async insert(problem: ProblemInsert): Promise<Problem | null> {
		log.debug("Inserting problem", { problem });
		const newProblem = await this.problemRepo.insert(problem);
		log.debug("Problem inserted", { problem: newProblem });
		return newProblem ?? null;
	}

	async insertMany(problems: ProblemInsert[]): Promise<Problem[] | null> {
		log.debug("Inserting problems", { problems });
		const newProblems = await this.problemRepo.insertMany(problems);
		log.debug("Problems inserted", { problems: newProblems });
		return newProblems ?? null;
	}

	async delete(id: string): Promise<void> {
		await this.problemRepo.delete(id);
	}

	async findById(id: string): Promise<Problem | null> {
		return this.problemRepo.findById(id);
	}

	async findAll(): Promise<Problem[]> {
		return this.problemRepo.findAll();
	}
}
