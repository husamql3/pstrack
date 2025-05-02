import { cn } from '@/utils/cn'
import { useRef } from 'react'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const resizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  return (
    <textarea
      ref={textareaRef}
      onInput={resizeTextarea}
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex max-h-40 min-h-16 w-full resize-none overflow-x-hidden rounded-md border bg-transparent px-3 py-2 text-base break-words shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
