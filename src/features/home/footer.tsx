import { META } from "./constants"

export function Footer() {
	return (
		<footer className="absolute right-0 bottom-0 left-0 z-10 flex w-full items-center justify-center bg-black py-4">
			<p className="flex items-center gap-1 font-light text-muted-foreground text-xs">
				© 2026 {META.SITE_NAME}. Built by{" "}
				<a
					href={META.AUTHOR_GITHUB_LINK}
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center gap-1 hover:underline"
				>
					<img src={META.AUTHOR_AVATAR} alt={META.AUTHOR_NAME} width={16} height={16} />
					{META.AUTHOR_NAME}
				</a>
			</p>
		</footer>
	)
}
