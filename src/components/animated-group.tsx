import { motion, type Variants } from "motion/react"
import type { ReactNode } from "react"
import React from "react"

export type PresetType =
	| "fade"
	| "slide"
	| "scale"
	| "blur"
	| "blur-slide"
	| "zoom"
	| "flip"
	| "bounce"
	| "rotate"
	| "swing"

export type AnimatedGroupProps = {
	children: ReactNode
	className?: string
	variants?: {
		container?: Variants
		item?: Variants
	}
	preset?: PresetType
	as?: keyof React.JSX.IntrinsicElements
	asChild?: keyof React.JSX.IntrinsicElements
	triggerOnView?: boolean
	viewportOptions?: {
		once?: boolean
		amount?: number | "some" | "all"
		margin?: string
	}
}

const defaultContainerVariants: Variants = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const defaultItemVariants: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
}

const presetVariants: Record<PresetType, Variants> = {
	fade: {},
	slide: {
		hidden: { y: 20 },
		visible: { y: 0 },
	},
	scale: {
		hidden: { scale: 0.8 },
		visible: { scale: 1 },
	},
	blur: {
		hidden: { filter: "blur(4px)" },
		visible: { filter: "blur(0px)" },
	},
	"blur-slide": {
		hidden: { filter: "blur(4px)", y: 20 },
		visible: { filter: "blur(0px)", y: 0 },
	},
	zoom: {
		hidden: { scale: 0.5 },
		visible: {
			scale: 1,
			transition: { type: "spring", stiffness: 300, damping: 20 },
		},
	},
	flip: {
		hidden: { rotateX: -90 },
		visible: {
			rotateX: 0,
			transition: { type: "spring", stiffness: 300, damping: 20 },
		},
	},
	bounce: {
		hidden: { y: -50 },
		visible: {
			y: 0,
			transition: { type: "spring", stiffness: 400, damping: 10 },
		},
	},
	rotate: {
		hidden: { rotate: -180 },
		visible: {
			rotate: 0,
			transition: { type: "spring", stiffness: 200, damping: 15 },
		},
	},
	swing: {
		hidden: { rotate: -10 },
		visible: {
			rotate: 0,
			transition: { type: "spring", stiffness: 300, damping: 8 },
		},
	},
}

const addDefaultVariants = (variants: Variants) => ({
	hidden: { ...defaultItemVariants.hidden, ...variants.hidden },
	visible: { ...defaultItemVariants.visible, ...variants.visible },
})

function AnimatedGroup({
	children,
	className,
	variants,
	preset,
	as = "div",
	asChild = "div",
	triggerOnView = false,
	viewportOptions = { once: true, amount: 0.3 },
}: AnimatedGroupProps) {
	const containerVariants = variants?.container ?? defaultContainerVariants
	const itemVariants =
		variants?.item ?? addDefaultVariants(preset ? presetVariants[preset] : {})

	const MotionComponent = motion[as as keyof typeof motion] as typeof motion.div
	const MotionChild = motion[asChild as keyof typeof motion] as typeof motion.div

	const animationProps = triggerOnView
		? {
				initial: "hidden",
				whileInView: "visible",
				viewport: viewportOptions,
			}
		: {
				initial: "hidden",
				animate: "visible",
			}

	return (
		<MotionComponent
			{...animationProps}
			variants={containerVariants}
			className={className}
		>
			{React.Children.map(children, (child, index) =>
				child == null ? null : (
					// biome-ignore lint/suspicious/noArrayIndexKey: children have no stable identity
					<MotionChild key={index} variants={itemVariants}>
						{child}
					</MotionChild>
				)
			)}
		</MotionComponent>
	)
}

export { AnimatedGroup }
