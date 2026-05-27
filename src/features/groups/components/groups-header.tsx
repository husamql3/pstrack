export const GroupsHeader = ({
	total,
	developers,
	joined,
}: {
	total: number
	developers: number
	joined: number
}) => {
	return (
		<div className="space-y-1">
			<h1 className="text-2xl font-semibold tracking-tight">Browse groups</h1>
			<p className="text-muted-foreground text-sm">
				{total} {total === 1 ? "group" : "groups"} · {developers}{" "}
				{developers === 1 ? "developer" : "developers"}
				{joined > 0 && (
					<>
						{" "}
						· <span className="text-foreground font-medium">{joined} you&apos;re in</span>
					</>
				)}
			</p>
		</div>
	)
}
