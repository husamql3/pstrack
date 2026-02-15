import "dotenv/config";
// import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from '../../generated/prisma/client'
// import { env } from '@/env'
// const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
// export const db = new PrismaClient({ adapter })

import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "generated/prisma/client";

import { env } from "@/env";

export const db = new PrismaClient({
	accelerateUrl: env.DATABASE_URL,
}).$extends(withAccelerate());
