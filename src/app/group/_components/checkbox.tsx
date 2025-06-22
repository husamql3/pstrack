import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { motion } from 'motion/react'

import { cn } from '@/utils/cn'

export const Checkbox = ({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}) => {
  return (
    <RadixCheckbox.Root
      className={cn(
        'flex h-5 w-5 flex-shrink-0 appearance-none items-center justify-center rounded-md border border-zinc-300 bg-white transition-colors outline-none hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500',
        'cursor-pointer',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      id="terms"
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <RadixCheckbox.Indicator>
        <motion.div
          className="h-[inherit] w-[inherit] rounded bg-blue-500 brightness-110 dark:bg-blue-600 dark:brightness-110"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <CheckIcon />
        </motion.div>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

const CheckIcon = () => {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
    >
      <motion.path
        d="M5 7.5L7 9.5L7.40859 8.81902C8.13346 7.6109 9.00376 6.49624 10 5.5V5.5"
        className="stroke-white dark:stroke-white"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{
          pathLength: 0,
        }}
        animate={{
          pathLength: 1,
        }}
        exit={{
          pathLength: 0,
        }}
        transition={{
          delay: 0.025,
          duration: 0.35,
        }}
      />
    </svg>
  )
}
