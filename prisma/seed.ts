/**
 * Global seed - runs all seed scripts in order.
 * Usage: bun run prisma/seed.ts
 */

import groupsData from "@/data/groups.json"
import { db } from "@/server/lib/db"
import { problemsDao } from "@/server/problems/problems.dao"

// ─── Problems ─────────────────────────────────────────────────────────────────

console.log("\n📚 Seeding problems...")
const problemResult = await problemsDao.seedStarterProblems()
console.log(`  ✓ ${problemResult.seeded} problems ready`)

// ─── Groups ───────────────────────────────────────────────────────────────────

console.log("\n👥 Seeding groups...")

const SEED_USERS = [
	{ name: "Alex Chen", email: "seed.alexchen@dev.test", username: "alexchen" },
	{ name: "Maria Santos", email: "seed.mariasantos@dev.test", username: "mariasantos" },
	{ name: "James Okafor", email: "seed.jamesokafor@dev.test", username: "jamesokafor" },
	{ name: "Sarah Kim", email: "seed.sarahkim@dev.test", username: "sarahkim" },
	{ name: "David Zhang", email: "seed.davidzhang@dev.test", username: "davidzhang" },
	{ name: "Emma Wilson", email: "seed.emmawilson@dev.test", username: "emmawilson" },
	{
		name: "Carlos Mendez",
		email: "seed.carlosmendez@dev.test",
		username: "carlosmendez",
	},
	{ name: "Nina Patel", email: "seed.ninapatel@dev.test", username: "ninapatel" },
	{
		name: "Oliver Brooks",
		email: "seed.oliverbrooks@dev.test",
		username: "oliverbrooks",
	},
	{ name: "Sofia Garcia", email: "seed.sofiagarcia@dev.test", username: "sofiagarcia" },
	{ name: "Ryan Liu", email: "seed.ryanliu@dev.test", username: "ryanliu" },
	{ name: "Ava Nakamura", email: "seed.avanakamura@dev.test", username: "avanakamura" },
	{ name: "Ethan Ross", email: "seed.ethanross@dev.test", username: "ethanross" },
	{ name: "Mia Park", email: "seed.miapark@dev.test", username: "miapark" },
	{ name: "Noah Fischer", email: "seed.noahfischer@dev.test", username: "noahfischer" },
	{ name: "Lily Wu", email: "seed.lilywu@dev.test", username: "lilywu" },
	{ name: "Lucas Ahmed", email: "seed.lucasahmed@dev.test", username: "lucasahmed" },
	{
		name: "Chloe Miranda",
		email: "seed.chloemiranda@dev.test",
		username: "chloemiranda",
	},
	{ name: "Mason Jones", email: "seed.masonjones@dev.test", username: "masonjones" },
	{
		name: "Isabella Brown",
		email: "seed.isabellabrown@dev.test",
		username: "isabellabrown",
	},
	{
		name: "Jackson Taylor",
		email: "seed.jacksontaylor@dev.test",
		username: "jacksontaylor",
	},
	{ name: "Grace Fisher", email: "seed.gracefisher@dev.test", username: "gracefisher" },
	{ name: "Aiden Grant", email: "seed.aidengrant@dev.test", username: "aidengrant" },
	{
		name: "Abigail Harris",
		email: "seed.abigailharris@dev.test",
		username: "abigailharris",
	},
	{
		name: "Elijah Jackson",
		email: "seed.elijahjackson@dev.test",
		username: "elijahjackson",
	},
	{ name: "Harper White", email: "seed.harperwhite@dev.test", username: "harperwhite" },
	{
		name: "Sebastian Moran",
		email: "seed.sebastianmoran@dev.test",
		username: "sebastianmoran",
	},
	{ name: "Evelyn Moore", email: "seed.evelynmoore@dev.test", username: "evelynmoore" },
	{ name: "Mateo Clark", email: "seed.mateoclark@dev.test", username: "mateoclark" },
	{
		name: "Amelia Rodriguez",
		email: "seed.ameliarodriguez@dev.test",
		username: "ameliarodriguez",
	},
	{ name: "Liam Davis", email: "seed.liamdavis@dev.test", username: "liamdavis" },
	{
		name: "Charlotte Hall",
		email: "seed.charlottehall@dev.test",
		username: "charlottehall",
	},
	{ name: "Henry Allen", email: "seed.henryallen@dev.test", username: "henryallen" },
	{ name: "Aurora Young", email: "seed.aurorayoung@dev.test", username: "aurorayoung" },
	{ name: "Samuel King", email: "seed.samuelking@dev.test", username: "samuelking" },
	{
		name: "Scarlett Wright",
		email: "seed.scarlettwright@dev.test",
		username: "scarlettwright",
	},
	{
		name: "Gabriel Scott",
		email: "seed.gabrielscott@dev.test",
		username: "gabrielscott",
	},
	{ name: "Hazel Green", email: "seed.hazelgreen@dev.test", username: "hazelgreen" },
	{ name: "Nathan Baker", email: "seed.nathanbaker@dev.test", username: "nathanbaker" },
	{ name: "Lily Carter", email: "seed.lilycarter@dev.test", username: "lilycarter" },
	{ name: "Julian Perez", email: "seed.julianperez@dev.test", username: "julianperez" },
	{ name: "Violet Roberts", email: "seed.violetrob@dev.test", username: "violetrob" },
	{ name: "Leo Evans", email: "seed.leoevans@dev.test", username: "leoevans" },
	{ name: "Luna Turner", email: "seed.lunaturner@dev.test", username: "lunaturner" },
	{
		name: "Caleb Phillips",
		email: "seed.calebphillips@dev.test",
		username: "calebphillips",
	},
	{
		name: "Ruby Campbell",
		email: "seed.rubycampbell@dev.test",
		username: "rubycampbell",
	},
	{ name: "Ryan Murphy", email: "seed.ryanmurphy@dev.test", username: "ryanmurphy" },
	{
		name: "Stella Parker",
		email: "seed.stellaparker@dev.test",
		username: "stellaparker",
	},
	{ name: "Finn Price", email: "seed.finnprice@dev.test", username: "finnprice" },
	{ name: "Zara Bennett", email: "seed.zarabennett@dev.test", username: "zarabennett" },
]

const users: { id: string; username: string | null }[] = []
for (const u of SEED_USERS) {
	const user = await db.user.upsert({
		where: { email: u.email },
		update: {},
		create: {
			id: crypto.randomUUID(),
			name: u.name,
			email: u.email,
			username: u.username,
			emailVerified: true,
		},
		select: { id: true, username: true },
	})
	users.push(user)
}
console.log(`  ✓ ${users.length} users ready`)

let groupCount = 0
for (let gi = 0; gi < groupsData.length; gi++) {
	const g = groupsData[gi]
	const adminUser = users[gi]

	const group = await db.group.upsert({
		where: { slug: g.slug },
		update: {},
		create: {
			slug: g.slug,
			type: g.type as "PUBLIC" | "PRIVATE",
			roadmap: g.roadmap as "NC250" | "NC150" | "BLIND75",
			maxMembers: g.maxMembers,
			creatorId: adminUser.id,
			isActive: true,
		},
		select: { id: true },
	})

	await db.groupMember.upsert({
		where: { groupId_userId: { groupId: group.id, userId: adminUser.id } },
		update: {},
		create: { groupId: group.id, userId: adminUser.id, role: "ADMIN" },
	})

	const others = users.filter((_, idx) => idx !== gi)
	const wanted = Math.min(g.memberCount - 1, others.length)
	const offset = (gi * 5) % others.length
	const picked = [
		...others.slice(offset, offset + wanted),
		...others.slice(0, Math.max(0, offset + wanted - others.length)),
	].slice(0, wanted)

	for (const user of picked) {
		await db.groupMember.upsert({
			where: { groupId_userId: { groupId: group.id, userId: user.id } },
			update: {},
			create: { groupId: group.id, userId: user.id, role: "MEMBER" },
		})
	}

	groupCount++
}
console.log(`  ✓ ${groupCount} groups ready`)

console.log("\n✅ All seeds complete")
process.exit(0)
