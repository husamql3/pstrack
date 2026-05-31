import { Skeleton } from "@/components/ui/skeleton"

export const SettingsSkeleton = ({ rows = 3 }: { rows?: number }) => (
	<div className="flex flex-col gap-6">
		{Array.from({ length: rows }).map((_, i) => (
			<Skeleton
				// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
				key={i}
				className="h-32 w-full"
			/>
		))}
	</div>
)
