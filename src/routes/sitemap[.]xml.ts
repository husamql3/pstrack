import { createFileRoute } from "@tanstack/react-router"

import { db } from "@/server/lib/db"

const SITE_URL = "https://pstrack.app"
const TODAY = new Date().toISOString().split("T")[0]

const STATIC_URLS = [
	{ loc: "/", priority: "1.0", changefreq: "weekly" },
	{ loc: "/problems", priority: "0.9", changefreq: "weekly" },
	{ loc: "/groups", priority: "0.9", changefreq: "daily" },
	{ loc: "/badges", priority: "0.6", changefreq: "monthly" },
	{ loc: "/about", priority: "0.7", changefreq: "monthly" },
	{ loc: "/how-it-works", priority: "0.7", changefreq: "monthly" },
]

function urlEntry({
	loc,
	lastmod = TODAY,
	priority = "0.5",
	changefreq = "weekly",
}: {
	loc: string
	lastmod?: string
	priority?: string
	changefreq?: string
}) {
	return `  <url>
    <loc>${SITE_URL}${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function generateSitemap(): Promise<string> {
	const thirtyDaysAgo = new Date()
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

	const [groups, users] = await Promise.all([
		db.group.findMany({
			where: {
				type: "PUBLIC",
				isActive: true,
				updatedAt: { gte: thirtyDaysAgo },
				members: { some: {} },
			},
			select: { slug: true, updatedAt: true, _count: { select: { members: true } } },
		}),
		db.user.findMany({
			where: { isPublic: true, username: { not: null } },
			select: { username: true, updatedAt: true },
		}),
	])

	const qualifiedGroups = groups.filter((g) => g._count.members >= 5)

	const staticEntries = STATIC_URLS.map((u) => urlEntry(u))

	const groupEntries = qualifiedGroups.map((g) =>
		urlEntry({
			loc: `/groups/${g.slug}`,
			lastmod: g.updatedAt.toISOString().split("T")[0],
			priority: "0.6",
			changefreq: "daily",
		})
	)

	const profileEntries = users
		.filter((u) => u.username)
		.map((u) =>
			urlEntry({
				loc: `/${u.username}`,
				lastmod: u.updatedAt.toISOString().split("T")[0],
				priority: "0.5",
				changefreq: "weekly",
			})
		)

	const entries = [...staticEntries, ...groupEntries, ...profileEntries].join("\n")

	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const xml = await generateSitemap()
				return new Response(xml, {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
					},
				})
			},
		},
	},
})
