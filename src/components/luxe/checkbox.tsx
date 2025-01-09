'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  onChange?: () => Promise<void>
}

export function Checkbox({ checked = false, disabled = false, onChange }: CheckboxProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [internalChecked, setInternalChecked] = useState(checked)

  useEffect(() => {
    setInternalChecked(checked)
  }, [checked])

  const handleChange = async () => {
    if (onChange && !disabled && !isLoading) {
      setIsLoading(true)
      setInternalChecked(!internalChecked)
      try {
        await onChange()
      } catch (error) {
        console.error('Error updating checkbox:', error)
        setInternalChecked(internalChecked) // Revert on error
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <RadixCheckbox.Root
      className={cn(
        'flex h-5 w-5 flex-shrink-0 appearance-none items-center justify-center rounded outline-none',
        disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isLoading
          ? 'border-transparent bg-transparent'
          : 'border border-neutral-800 bg-neutral-900'
      )}
      checked={internalChecked}
      disabled={disabled || isLoading}
      onCheckedChange={handleChange}
    >
      <RadixCheckbox.Indicator>
        {isLoading ? (
          <motion.div
            className="flex h-[inherit] w-[inherit] items-center justify-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Loader2 className="z-50 size-3 animate-spin" />
          </motion.div>
        ) : (
          <motion.div
            className="h-[inherit] w-[inherit] rounded bg-white"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: internalChecked ? 1 : 0,
              opacity: internalChecked ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <CheckIcon />
          </motion.div>
        )}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  )
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M5 7.5L7 9.5L7.40859 8.81902C8.13346 7.6109 9.00376 6.49624 10 5.5V5.5"
        stroke="#000"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{
          opacity: 0,
          pathLength: 0,
        }}
        animate={{
          opacity: 1,
          pathLength: 1,
        }}
        exit={{
          opacity: 0,
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
