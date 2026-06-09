export const META = {
	url: "https://pstrack.app",
	name: "PStrack",
	titleSuffix: "PStrack",
	og: {
		defaultImage: "/og-default.png",
		type: "website",
		locale: "en_US",
		imageWidth: "1200",
		imageHeight: "630",
	},
	twitter: {
		card: "summary_large_image",
	},
	robots: {
		noindex: "noindex, nofollow",
	},
} as const

type JsonLd = Record<string, unknown> | Array<Record<string, unknown>>

type SeoInput = {
	title: string
	description: string
	path: string
	image?: string
	noindex?: boolean
	schema?: JsonLd
}

type HeadMeta = { title?: string } & Record<string, string>
type HeadLink = Record<string, string>
type HeadScript = { type?: string; children?: string; src?: string }

type SeoHead = {
	meta: Array<HeadMeta>
	links: Array<HeadLink>
	scripts: Array<HeadScript>
}

const normalizePath = (path: string) => {
	if (!path.startsWith("/")) return `/${path}`
	return path
}

const buildTitle = (title: string) =>
	title === META.titleSuffix ? title : `${title} | ${META.titleSuffix}`

const buildOgImageUrl = (title: string) => {
	const params = new URLSearchParams({ title })
	return `${META.url}/api/v3/og?${params.toString()}`
}

export const createSeoHead = ({
	title,
	description,
	path,
	image,
	noindex = false,
	schema,
}: SeoInput): SeoHead => {
	const ogImage = image
		? image.startsWith("http")
			? image
			: `${META.url}${normalizePath(image)}`
		: buildOgImageUrl(title)
	const fullTitle = buildTitle(title)
	const canonical = `${META.url}${normalizePath(path)}`

	const meta: Array<HeadMeta> = [
		{ title: fullTitle },
		{ name: "description", content: description },
		{ property: "og:title", content: fullTitle },
		{ property: "og:description", content: description },
		{ property: "og:type", content: META.og.type },
		{ property: "og:url", content: canonical },
		{ property: "og:site_name", content: META.name },
		{ property: "og:image", content: ogImage },
		{ property: "og:image:width", content: META.og.imageWidth },
		{ property: "og:image:height", content: META.og.imageHeight },
		{ property: "og:locale", content: META.og.locale },
		{ name: "twitter:card", content: META.twitter.card },
		{ name: "twitter:title", content: fullTitle },
		{ name: "twitter:description", content: description },
		{ name: "twitter:image", content: ogImage },
	]

	if (noindex) {
		meta.push({ name: "robots", content: META.robots.noindex })
	}

	const links: Array<HeadLink> = [{ rel: "canonical", href: canonical }]

	const scripts: Array<HeadScript> = []
	if (schema) {
		scripts.push({
			type: "application/ld+json",
			children: JSON.stringify(schema),
		})
	}

	return { meta, links, scripts }
}

export const siteUrl = META.url
export const siteName = META.name
