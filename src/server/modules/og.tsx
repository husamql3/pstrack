import Elysia, { t } from "elysia"
import satori from "satori"

const OG_WIDTH = 1200
const OG_HEIGHT = 630

let fontsPromise: Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> | null = null

const loadFonts = (origin: string) => {
	if (!fontsPromise) {
		fontsPromise = Promise.all([
			fetch(`${origin}/fonts/geist-400.woff`).then((r) => r.arrayBuffer()),
			fetch(`${origin}/fonts/geist-600.woff`).then((r) => r.arrayBuffer()),
		])
			.then(([regular, bold]) => ({ regular, bold }))
			.catch((err) => {
				fontsPromise = null
				throw err
			})
	}
	return fontsPromise
}

export const og = new Elysia({ prefix: "/og" }).get(
	"/",
	async ({ query, request }) => {
		const { regular: geistFontRegular, bold: geistFont } = await loadFonts(
			new URL(request.url).origin
		)

		const title = query.title ?? "PStrack"
		const subtitle = query.subtitle ?? "Show up. Solve. Repeat."

		const fontSize = title.length > 40 ? 52 : 64

		const svg = await satori(
			<div
				style={{
					width: OG_WIDTH,
					height: OG_HEIGHT,
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "flex-start",
					padding: "80px",
					backgroundColor: "#09090b",
					fontFamily: "Geist",
				}}
			>
				<span
					style={{
						fontSize: 28,
						fontWeight: 600,
						color: "#a1a1aa",
						letterSpacing: "-0.02em",
						marginBottom: "40px",
					}}
				>
					PStrack
				</span>
				<div
					style={{
						fontSize,
						fontWeight: 600,
						color: "#fafafa",
						letterSpacing: "-0.03em",
						lineHeight: 1.1,
						maxWidth: 900,
						marginBottom: "32px",
					}}
				>
					{title}
				</div>
				<div
					style={{
						fontSize: 28,
						fontWeight: 400,
						color: "#71717a",
						letterSpacing: "-0.01em",
					}}
				>
					{subtitle}
				</div>
			</div>,
			{
				width: OG_WIDTH,
				height: OG_HEIGHT,
				fonts: [
					{ name: "Geist", data: geistFontRegular, weight: 400, style: "normal" },
					{ name: "Geist", data: geistFont, weight: 600, style: "normal" },
				],
			}
		)

		const { Resvg } = await import("@resvg/resvg-js")
		const resvg = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } })
		const png = resvg.render().asPng()

		return new Response(png.buffer as ArrayBuffer, {
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
			},
		})
	},
	{
		query: t.Object({
			title: t.Optional(t.String()),
			subtitle: t.Optional(t.String()),
		}),
	}
)
