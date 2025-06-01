'use client'

import Link from 'next/link'
import { LuFile } from 'react-icons/lu'
import { BiSolidFolderOpen, BiSolidFolder } from 'react-icons/bi'
import { PiYoutubeLogo } from 'react-icons/pi'
import { SiUdemy } from 'react-icons/si'
import { MdVideoLibrary } from 'react-icons/md'
import type { ComponentProps, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { cn } from '@/utils/cn'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  type AccordionItemProps,
  AccordionTrigger,
  type AccordionTriggerProps,
  useAccordionItem,
} from '@/ui/accordion'
import { MotionHighlight, MotionHighlightItem } from '@/ui/motion-highlight'
import Image from 'next/image'

type FileButtonProps = ComponentProps<'div'> & {
  icons?: {
    close: ReactNode
    open: ReactNode
  }
  icon?: ReactNode
  open?: boolean
  sideComponent?: ReactNode
  href?: string
}

function FileButton({ children, className, icons, icon, open, sideComponent, href, ...props }: FileButtonProps) {
  const content = (
    <span className="flex shrink-1 items-center gap-2 truncate [&_svg]:size-4 [&_svg]:shrink-0">
      {icon
        ? typeof icon !== 'string'
          ? icon
          : null
        : icons && (
            <AnimatePresence mode="wait">
              <motion.span
                key={open ? 'open' : 'close'}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                {open
                  ? typeof icons.open !== 'string'
                    ? icons.open
                    : null
                  : typeof icons.close !== 'string'
                    ? icons.close
                    : null}
              </motion.span>
            </AnimatePresence>
          )}
      <span className="block shrink-1 truncate text-sm break-words">{children}</span>
    </span>
  )

  return (
    <MotionHighlightItem className="size-full">
      <div
        data-slot="file-button"
        className={cn(
          'relative z-10 flex h-10 w-full cursor-default items-center gap-2 truncate rounded-lg p-2',
          className
        )}
        {...props}
      >
        {href ? (
          <Link
            href={href}
            className="flex w-full shrink-1 items-center gap-2 truncate [&_svg]:size-4 [&_svg]:shrink-0"
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </Link>
        ) : (
          content
        )}
        {sideComponent}
      </div>
    </MotionHighlightItem>
  )
}

type FilesProps = ComponentProps<'div'> & {
  children: ReactNode
  activeClassName?: string
  defaultOpen?: string[]
  open?: string[]
  onOpenChange?: (open: string[]) => void
}

function Files({ children, className, activeClassName, defaultOpen, open, onOpenChange, ...props }: FilesProps) {
  return (
    <div
      data-slot="files"
      className={cn('bg-background relative size-full overflow-auto rounded-xl border', className)}
      {...props}
    >
      <MotionHighlight
        controlledItems
        mode="parent"
        hover
        className={cn('bg-muted pointer-events-none rounded-lg', activeClassName)}
      >
        <Accordion
          type="multiple"
          className="p-2"
          defaultValue={defaultOpen}
          value={open}
          onValueChange={onOpenChange}
        >
          {children}
        </Accordion>
      </MotionHighlight>
    </div>
  )
}

type FolderTriggerProps = AccordionTriggerProps & {
  sideComponent?: ReactNode
}

function FolderTrigger({ children, className, sideComponent, ...props }: FolderTriggerProps) {
  const { isOpen } = useAccordionItem()

  return (
    <AccordionTrigger
      data-slot="folder-trigger"
      className="relative z-10 h-auto max-w-full py-0 font-normal hover:no-underline"
      {...props}
      chevron={false}
    >
      <FileButton
        open={isOpen}
        icons={{
          open: <BiSolidFolderOpen />,
          close: <BiSolidFolder />,
        }}
        className={className}
        sideComponent={sideComponent}
      >
        {children}
      </FileButton>
    </AccordionTrigger>
  )
}

type FolderProps = Omit<AccordionItemProps, 'value' | 'onValueChange' | 'defaultValue' | 'children'> & {
  children?: ReactNode
  name: string
  open?: string[]
  onOpenChange?: (open: string[]) => void
  defaultOpen?: string[]
  sideComponent?: ReactNode
}

function Folder({ children, className, name, open, defaultOpen, onOpenChange, sideComponent, ...props }: FolderProps) {
  return (
    <AccordionItem
      data-slot="folder"
      value={name}
      className="relative border-b-0"
      {...props}
    >
      <FolderTrigger
        className={className}
        sideComponent={sideComponent}
      >
        {name.toLowerCase()}
      </FolderTrigger>
      {children && (
        <AccordionContent className="before:bg-border relative !ml-7 pb-0 before:absolute before:inset-y-0 before:-left-3 before:h-full before:w-px">
          <Accordion
            type="multiple"
            defaultValue={defaultOpen}
            value={open}
            onValueChange={onOpenChange}
          >
            {children}
          </Accordion>
        </AccordionContent>
      )}
    </AccordionItem>
  )
}

type FileProps = Omit<ComponentProps<'div'>, 'children'> & {
  name: string
  sideComponent?: ReactNode
  href?: string
  type?: string
}

function File({ name, className, sideComponent, href, type, ...props }: FileProps) {
  const getIcon = () => {
    switch (type?.toLowerCase()) {
      case 'youtube':
        return <PiYoutubeLogo className="text-red-500" />
      case 'video':
        return <MdVideoLibrary className="text-blue-500" />
      case 'udemy':
        return <SiUdemy className="text-purple-500" />
      case 'frontendmasters':
        return (
          <Image
            src="/fem.png"
            alt="Frontend Masters"
            width={18}
            height={18}
          />
        )
      case 'article':
      default:
        return <LuFile className="text-gray-500" />
    }
  }

  return (
    <FileButton
      data-slot="file"
      icon={getIcon()}
      className={className}
      sideComponent={sideComponent}
      href={href}
      {...props}
    >
      {name}
    </FileButton>
  )
}

export { Files, Folder, File, type FilesProps, type FolderProps, type FileProps }
