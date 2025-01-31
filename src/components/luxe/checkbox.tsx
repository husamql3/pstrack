'use client'

import { useEffect, useState } from 'react'
import * as RadixCheckbox from '@radix-ui/react-checkbox'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  onChange?: () => Promise<void> | void // Ensure onChange can be async
}

export function Checkbox({ checked = false, disabled = false, onChange }: CheckboxProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [internalChecked, setInternalChecked] = useState(checked)

  // Sync internalChecked with the external `checked` prop
  useEffect(() => {
    setInternalChecked(checked)
  }, [checked])

  const handleChange = async () => {
    if (disabled || isLoading || !onChange) return

    setIsLoading(true)

    try {
      await onChange()

      // Update the internal state only if the request succeeds
      setInternalChecked(!internalChecked)
    } catch (error) {
      console.error('Error updating checkbox:', error)
      // Revert the state if the request fails
      setInternalChecked(checked)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RadixCheckbox.Root
      className={cn(
        'flex h-5 w-5 flex-shrink-0 appearance-none items-center justify-center rounded outline-none',
        disabled || isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        isLoading ? 'border-transparent bg-transparent' : 'border border-neutral-800 bg-neutral-900'
      )}
      checked={internalChecked}
      disabled={disabled || isLoading}
      onCheckedChange={handleChange}
    >
      <RadixCheckbox.Indicator>
        {isLoading ? (
          <div className="flex h-[inherit] w-[inherit] items-center justify-center">
            <Loader2 className="z-50 size-3 animate-spin" />
          </div>
        ) : (
          internalChecked && (
            <div className="h-[inherit] w-[inherit] rounded bg-white">
              <CheckIcon />
            </div>
          )
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
      <path
        d="M5 7.5L7 9.5L7.40859 8.81902C8.13346 7.6109 9.00376 6.49624 10 5.5V5.5"
        stroke="#000"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
