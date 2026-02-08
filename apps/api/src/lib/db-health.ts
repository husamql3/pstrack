import { sql } from "drizzle-orm";

import { db } from "@/db";

export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		await db.execute(sql`SELECT 1`);
		return true;
	} catch {
		return false;
	}
}
