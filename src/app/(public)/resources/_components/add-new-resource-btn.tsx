'use client'

// import { useCallback, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { toast } from 'sonner'

// import { errorToastStyle, infoToastStyle, loadingToastStyle, successToastStyle } from '@/app/_components/toast-styles'
// import { api } from '@/trpc/react'

// import { Button } from '@/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/ui/dialog'
// import { type FormDataType, RequestForm } from '@/app/group/_components/request-form'
import { PlusIcon } from 'lucide-react'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { api } from '@/trpc/react'
import { useId, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/ui/command'
import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export const AddNewResourceBtn = () => {
  const { data: resourceTypes } = api.resources.getResourceTypes.useQuery()
  const { data: resourceTopics } = api.resources.getResourceTopics.useQuery()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="mr-4 flex items-center gap-2"
        >
          Add Resource
          <PlusIcon className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-full">
        <DialogTitle>Share a resource with the community</DialogTitle>

        <DialogDescription>Share your expertise with the community.</DialogDescription>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input placeholder="e.g. 'React Hooks' or 'Leetcode 100'" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Input placeholder="e.g. 'Learn about React Hooks and how to use them'" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Link</Label>
            <Input placeholder="e.g. 'https://reactjs.org/docs/hooks-intro.html'" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes?.map((type) => (
                  <SelectItem
                    key={type.value}
                    value={type.value}
                  >
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <TopicSelect
              topics={resourceTopics}
              value=""
              onValueChange={() => {}}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Contributor</Label>
            <Input placeholder="e.g. 'John Doe'" />
            <p className="text-muted-foreground text-sm">This will be displayed as the author of the resource.</p>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit">Add Resource</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Searchable topic select component
const TopicSelect = ({
  topics,
  value,
  onValueChange,
}: {
  topics: { topic: string }[] | undefined
  value: string
  onValueChange: (value: string) => void
}) => {
  const id = useId()
  const [open, setOpen] = useState<boolean>(false)

  const topicOptions =
    topics?.map(({ topic }) => ({
      value: topic,
      label: topic,
    })) || []

  return (
    <div>
      <Label htmlFor={id}>Topic</Label>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="bg-background hover:bg-background border-input mt-2 w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:outline-[3px]"
          >
            <span className={cn('truncate', !value && 'text-muted-foreground')}>
              {value ? topicOptions.find((topic) => topic.value === value)?.label : 'Select a topic'}
            </span>
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground/80 shrink-0"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-input w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search topics..." />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandEmpty>No topic found.</CommandEmpty>
              <CommandGroup>
                {topicOptions.map((topic) => (
                  <CommandItem
                    key={topic.value}
                    value={topic.value}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue === value ? '' : currentValue)
                      setOpen(false)
                    }}
                  >
                    {topic.label}
                    {value === topic.value && (
                      <CheckIcon
                        size={16}
                        className="ml-auto"
                      />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
