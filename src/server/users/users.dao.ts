import { db } from "@/server/lib/db"

export const usersDao = {
	findByUsername: async (username: string) =>
		db.user.findUnique({ where: { username }, select: { id: true } }),
}
