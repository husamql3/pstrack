import groups from "../../prisma/data/groups.json"

export const SEED_USERNAMES = [
	"alexchen",
	"mariasantos",
	"jamesokafor",
	"sarahkim",
	"davidzhang",
	"emmawilson",
	"carlosmendez",
	"ninapatel",
	"oliverbrooks",
	"sofiagarcia",
	"ryanliu",
	"avanakamura",
	"ethanross",
	"miapark",
	"noahfischer",
	"lilywu",
	"lucasahmed",
	"chloemiranda",
	"masonjones",
	"isabellabrown",
	"jacksontaylor",
	"gracefisher",
	"aidengrant",
	"abigailharris",
	"elijahjackson",
	"harperwhite",
	"sebastianmoran",
	"evelynmoore",
	"mateoclark",
	"ameliarodriguez",
	"liamdavis",
	"charlottehall",
	"henryallen",
	"aurorayoung",
	"samuelking",
	"scarlettwright",
	"gabrielscott",
	"hazelgreen",
	"nathanbaker",
	"lilycarter",
	"julianperez",
	"violetrob",
	"leoevans",
	"lunaturner",
	"calebphillips",
	"rubycampbell",
	"ryanmurphy",
	"stellaparker",
	"finnprice",
	"zarabennett",
]
const EXPECTED_USERS = new Set(
	SEED_USERNAMES.map((username) => `seed-user-${username}\0seed.${username}@dev.test`)
)
export const SEED_GROUPS = groups.map((group, index) => ({
	id: `seed-group-${group.slug}`,
	creatorId: `seed-user-${SEED_USERNAMES[index]}`,
	memberCount: group.memberCount,
	dailyProblemCount: 35,
}))
const EXPECTED_GROUPS = new Set(
	SEED_GROUPS.map(
		(group) =>
			`${group.id}\0${group.creatorId}\0${group.memberCount}\0${group.dailyProblemCount}`
	)
)
const EXPECTED_USER_COUNT = EXPECTED_USERS.size
const EXPECTED_GROUP_COUNT = EXPECTED_GROUPS.size
const EXPECTED_DAILY_PROBLEM_COUNT = EXPECTED_GROUP_COUNT * 35

export const buildStagingSeedEvidence = ({
	users,
	groups,
	dailyProblemCount,
}: {
	users: { id: string; email: string }[]
	groups: {
		id: string
		creatorId: string
		memberCount: number
		dailyProblemCount: number
	}[]
	dailyProblemCount: number
}) => {
	const actualUsers = new Set(users.map((user) => `${user.id}\0${user.email}`))
	const actualGroups = new Set(
		groups.map(
			(group) =>
				`${group.id}\0${group.creatorId}\0${group.memberCount}\0${group.dailyProblemCount}`
		)
	)
	const unexpectedUserCount = [...actualUsers].filter(
		(value) => !EXPECTED_USERS.has(value)
	).length
	const missingUserCount = [...EXPECTED_USERS].filter(
		(value) => !actualUsers.has(value)
	).length
	const unexpectedGroupCount = [...actualGroups].filter(
		(value) => !EXPECTED_GROUPS.has(value)
	).length
	const missingGroupCount = [...EXPECTED_GROUPS].filter(
		(value) => !actualGroups.has(value)
	).length

	return {
		healthy:
			users.length === EXPECTED_USER_COUNT &&
			unexpectedUserCount === 0 &&
			missingUserCount === 0 &&
			groups.length === EXPECTED_GROUP_COUNT &&
			unexpectedGroupCount === 0 &&
			missingGroupCount === 0 &&
			dailyProblemCount === EXPECTED_DAILY_PROBLEM_COUNT,
		userCount: users.length,
		groupCount: groups.length,
		dailyProblemCount,
		unexpectedUserCount,
		missingUserCount,
		unexpectedGroupCount,
		missingGroupCount,
	}
}
