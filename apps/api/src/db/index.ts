import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/db/schema";
import { env } from "@/env";

export const db = drizzle(env.DATABASE_URL, { schema });

export type DBType = typeof db;
