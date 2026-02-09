import { group } from "@/db/schema";

export type Group = typeof group.$inferSelect;
export type GroupInsert = typeof group.$inferInsert;
export type GroupUpdate = Partial<GroupInsert>;
