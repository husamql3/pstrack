import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { group, groupMember, GroupMemberRole, group as groupSchema } from "@/db/schema";
import { redis } from "@/lib/cache/client";
import { CACHE_KEYS, CACHE_TTL } from "@/lib/cache/keys";
import type { GroupInsert, GroupUpdate, Group } from "@/types/group.type";

export class GroupRepository {
	async findById(id: string): Promise<Group | null> {
		const cacheKey = CACHE_KEYS.group(id);
		const cached = await redis.get<Group>(cacheKey);
		if (cached) {
			return cached;
		}

		const group = await db.query.group.findFirst({
			where: eq(groupSchema.id, id),
		});
		if (group) {
			await redis.setex(cacheKey, CACHE_TTL.group, group);
		}

		return group ?? null;
	}

	async findAll(): Promise<Group[]> {
		const cacheKey = CACHE_KEYS.groups();
		const cached = await redis.get<Group[]>(cacheKey);
		if (cached) {
			return cached;
		}

		const groups = await db.query.group.findMany();
		if (groups) {
			await redis.setex(cacheKey, CACHE_TTL.groups, groups);
		}

		return groups ?? [];
	}

	async insert(data: GroupInsert): Promise<Group | null> {
		const [newGroup] = await db.insert(groupSchema).values(data).returning();

		await this.invalidateListCaches();

		return newGroup ?? null;
	}

	async update(id: string, data: GroupUpdate): Promise<Group | null> {
		const [updatedGroup] = await db.update(groupSchema).set(data).where(eq(groupSchema.id, id)).returning();

		await redis.del(CACHE_KEYS.group(id));

		return updatedGroup ?? null;
	}

	async findUserGroups(userId: string): Promise<Group[]> {
		const cacheKey = CACHE_KEYS.userGroups(userId);
		const cached = await redis.get<Group[]>(cacheKey);
		if (cached) {
			return cached;
		}

		const groupMembers = await db.query.groupMember.findMany({
			where: eq(groupMember.userId, userId),
			with: {
				group: true,
			},
		});

		const groups = groupMembers.map((groupMember) => groupMember.group);
		if (groups) {
			await redis.setex(cacheKey, CACHE_TTL.userGroups, groups);
		}

		return groups ?? [];
	}

	async joinGroup(userId: string, groupId: string, role: GroupMemberRole = "member"): Promise<void> {
		await db.transaction(async (tx) => {
			await tx.insert(groupMember).values({
				userId,
				groupId,
				role,
			});

			await tx
				.update(group)
				.set({
					currentMemberCount: sql`${group.currentMemberCount} + 1`,
				})
				.where(eq(group.id, groupId));
		});

		// Invalidate caches
		await Promise.all([
			redis.del(CACHE_KEYS.group(groupId)),
			redis.del(CACHE_KEYS.userGroups(userId)),
			// redis.del(CACHE_KEYS.groupStats(groupId)),
		]);
	}

	private async invalidateListCaches(): Promise<void> {
		const pattern = CACHE_KEYS.group("*");
		await redis.del(pattern);
	}
}
