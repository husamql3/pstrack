import { db } from "@/db";

export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		await db.$executeRaw`SELECT 1`;
		return true;
	} catch {
		return false;
	}
}
