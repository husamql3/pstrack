'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, type HTMLMotionProps, motion, type Transition } from 'motion/react'
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

import { cn } from '@/utils/cn'

type AccordionItemContextType = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const AccordionItemContext = createContext<AccordionItemContextType | undefined>(undefined)

const useAccordionItem = (): AccordionItemContextType => {
  const context = useContext(AccordionItemContext)
  if (!context) {
    throw new Error('useAccordionItem must be used within an AccordionItem')
  }
  return context
}

type AccordionProps = ComponentProps<typeof AccordionPrimitive.Root>

function Accordion(props: AccordionProps) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      {...props}
    />
  )
}

type AccordionItemProps = ComponentProps<typeof AccordionPrimitive.Item> & {
  children: ReactNode
}

function AccordionItem({ className, children, ...props }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AccordionItemContext.Provider value={{ isOpen, setIsOpen }}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn('border-b', className)}
        {...props}
      >
        {children}
      </AccordionPrimitive.Item>
    </AccordionItemContext.Provider>
  )
}

type AccordionTriggerProps = ComponentProps<typeof AccordionPrimitive.Trigger> & {
  transition?: Transition
  chevron?: boolean
}

function AccordionTrigger({
  ref,
  className,
  children,
  transition = { type: 'spring', stiffness: 150, damping: 22 },
  chevron = true,
  ...props
}: AccordionTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement)
  const { isOpen, setIsOpen } = useAccordionItem()

  useEffect(() => {
    const node = triggerRef.current
    if (!node) return

    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.attributeName === 'data-state') {
          const currentState = node.getAttribute('data-state')
          setIsOpen(currentState === 'open')
        }
      }
    })
    observer.observe(node, {
      attributes: true,
      attributeFilter: ['data-state'],
    })
    const initialState = node.getAttribute('data-state')
    setIsOpen(initialState === 'open')
    return () => {
      observer.disconnect()
    }
  }, [setIsOpen])

  return (
    <AccordionPrimitive.Header
      data-slot="accordion-header"
      className="flex"
    >
      <AccordionPrimitive.Trigger
        ref={triggerRef}
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-start font-medium hover:underline',
          className
        )}
        {...props}
      >
        {children}

        {chevron && (
          <motion.div
            data-slot="accordion-trigger-chevron"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={transition}
          >
            <ChevronDown className="size-5 shrink-0" />
          </motion.div>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

type AccordionContentProps = ComponentProps<typeof AccordionPrimitive.Content> &
  HTMLMotionProps<'div'> & {
    transition?: Transition
  }

function AccordionContent({
  className,
  children,
  transition = { type: 'spring', stiffness: 150, damping: 22 },
  ...props
}: AccordionContentProps) {
  const { isOpen } = useAccordionItem()

  return (
    <AnimatePresence>
      {isOpen && (
        <AccordionPrimitive.Content
          forceMount
          {...props}
        >
          <motion.div
            key="accordion-content"
            data-slot="accordion-content"
            initial={{ height: 0, opacity: 0, '--mask-stop': '0%' }}
            animate={{ height: 'auto', opacity: 1, '--mask-stop': '100%' }}
            exit={{ height: 0, opacity: 0, '--mask-stop': '0%' }}
            transition={transition}
            style={{
              maskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
              WebkitMaskImage: 'linear-gradient(black var(--mask-stop), transparent var(--mask-stop))',
            }}
            className="overflow-hidden"
            {...props}
          >
            <div className={cn('pt-0 pb-4 text-sm', className)}>{children}</div>
          </motion.div>
        </AccordionPrimitive.Content>
      )}
    </AnimatePresence>
  )
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  useAccordionItem,
  type AccordionItemContextType,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
}
