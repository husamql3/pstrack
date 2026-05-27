export const ProgressDisplay = ({
	solved,
	total,
	percent,
}: {
	solved: number
	total: number
	percent: number
}) => (
	<div className="flex items-center gap-3">
		<div className="font-mono tabular-nums">
			<p className="text-end text-sm leading-none">
				<span className="text-emerald-400">{solved}</span>
				<span className="text-muted-foreground">/{total}</span>
			</p>
			<p className="text-muted-foreground mt-1 text-xs">{percent}% complete</p>
		</div>
		<div className="bg-muted h-1.5 w-26 min-w-16 shrink-0 overflow-hidden rounded-full">
			<div
				className="h-full rounded-full bg-emerald-500 transition-[width]"
				style={{ width: `${percent}%` }}
			/>
		</div>
	</div>
)
