import { IconPlus } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

export const GroupsHeader = ({
	total,
	developers,
	joined,
	canCreate,
	onCreateGroup,
}: {
	total: number
	developers: number
	joined: number
	canCreate?: boolean
	onCreateGroup?: () => void
}) => {
	return (
		<div className="flex items-start justify-between gap-4">
			<div className="space-y-1">
				<h1 className="font-semibold text-2xl tracking-tight">Browse groups</h1>
				<p className="text-muted-foreground text-sm">
					{total} {total === 1 ? "group" : "groups"} · {developers}{" "}
					{developers === 1 ? "developer" : "developers"}
					{joined > 0 && (
						<>
							{" "}
							·{" "}
							<span className="font-medium text-foreground">{joined} you&apos;re in</span>
						</>
					)}
				</p>
			</div>
			{canCreate && (
				<Button size="sm" onClick={onCreateGroup}>
					<IconPlus className="size-4" />
					New Group
				</Button>
			)}
		</div>
	)
}
