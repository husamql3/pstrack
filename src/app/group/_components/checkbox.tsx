import { motion } from 'motion/react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'

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
        'flex h-5 w-5 flex-shrink-0 appearance-none items-center justify-center rounded border border-neutral-300 bg-neutral-100 outline-none dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
      id="terms"
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    >
      <RadixCheckbox.Indicator>
        <motion.div
          className="h-[inherit] w-[inherit] rounded bg-black dark:bg-white"
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
        className="stroke-white dark:stroke-black"
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
