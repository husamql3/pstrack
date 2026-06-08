import { CompassIcon, HomeIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Empty({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty"
			className={cn(
				"flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 text-balance rounded-xl border-dashed p-6 text-center",
				className
			)}
			{...props}
		/>
	)
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-header"
			className={cn("flex max-w-sm flex-col items-center gap-2", className)}
			{...props}
		/>
	)
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-title"
			className={cn("cn-font-heading font-medium text-sm tracking-tight", className)}
			{...props}
		/>
	)
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
	return (
		<div
			data-slot="empty-description"
			className={cn(
				"text-muted-foreground text-sm/relaxed [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
				className
			)}
			{...props}
		/>
	)
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="empty-content"
			className={cn(
				"flex w-full min-w-0 max-w-sm flex-col items-center gap-2.5 text-balance text-sm",
				className
			)}
			{...props}
		/>
	)
}

export function NotFoundPage() {
	return (
		<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
			<Empty>
				<EmptyHeader>
					<EmptyTitle className="mask-b-from-20% mask-b-to-80% font-extrabold text-9xl">
						404
					</EmptyTitle>
					<EmptyDescription className="-mt-8 text-nowrap text-foreground/80">
						The page you&apos;re looking for might have been <br />
						moved or doesn&apos;t exist.
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex gap-2">
						<Button asChild>
							<a href="/">
								<HomeIcon data-icon="inline-start" />
								Go Home
							</a>
						</Button>
						<Button asChild variant="outline">
							<a href="/groups">
								<CompassIcon data-icon="inline-start" />
								Explore
							</a>
						</Button>
					</div>
				</EmptyContent>
			</Empty>
		</div>
	)
}
