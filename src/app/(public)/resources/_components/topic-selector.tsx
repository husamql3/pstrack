'use client'

import { useState } from 'react'
import { PlusIcon, CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react'

import { cn } from '@/utils/cn'

import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/ui/command'

export const TopicSelector = ({
  topics,
  selectedTopic,
  onTopicSelect,
}: {
  topics: { topic: string }[]
  selectedTopic: string | undefined
  onTopicSelect: (topic: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newTopicValue, setNewTopicValue] = useState('')

  const handleCancelAddNew = () => {
    setNewTopicValue('')
    setIsAddingNew(false)
  }

  if (isAddingNew) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex h-full items-center justify-between gap-2">
          <Input
            id="topic"
            placeholder="Enter new topic name..."
            value={newTopicValue}
            onChange={(e) => setNewTopicValue(e.target.value)}
            autoFocus
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelAddNew}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          id="topic"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedTopic ? topics?.find((topic) => topic.topic === selectedTopic)?.topic : 'Select a topic...'}
          <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id="topic-popover"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command className="max-h-[300px]">
          <CommandInput placeholder="Search topics..." />
          <CommandList className="max-h-[200px] overflow-auto">
            <CommandEmpty>No topic found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="Add new topic"
                onSelect={() => {
                  setOpen(false)
                  setIsAddingNew(true)
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add new topic
              </CommandItem>
              {topics?.map((topic) => (
                <CommandItem
                  key={topic.topic}
                  value={topic.topic}
                  onSelect={(currentValue) => {
                    onTopicSelect(currentValue === selectedTopic ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn('mr-2 h-4 w-4', selectedTopic === topic.topic ? 'opacity-100' : 'opacity-0')}
                  />
                  {topic.topic}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
