import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "@/db/schema";

export const db = drizzle(process.env.DATABASE_URL ?? "", { schema });
