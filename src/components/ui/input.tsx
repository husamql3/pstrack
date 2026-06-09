import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

const inputVariants = cva(
	"h-9 w-full min-w-0 rounded-md border px-2.5 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
	{
		variants: {
			variant: {
				default:
					"border-input bg-transparent shadow-xs focus-visible:border-ring dark:bg-input/30",
				ghost:
					"border-border bg-transparent shadow-none focus-visible:border-border/40 focus-visible:bg-background focus-visible:shadow-sm dark:focus-visible:border-input/40 dark:focus-visible:bg-input/30",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

function Input({
	className,
	variant = "default",
	type,
	...props
}: ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
	return (
		<input
			type={type}
			data-slot="input"
			data-variant={variant}
			className={cn(inputVariants({ variant }), className)}
			{...props}
		/>
	)
}

export { Input, inputVariants }
