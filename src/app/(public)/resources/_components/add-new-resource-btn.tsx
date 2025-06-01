'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/ui/dialog'
import { PlusIcon } from 'lucide-react'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { api } from '@/trpc/react'
import { useForm } from 'react-hook-form'
import { type AddNewResourceSchemaType, AddNewResourceSchema } from '@/types/schema/resources.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { TopicSelector } from '@/app/(public)/resources/_components/topic-selector'

export const AddNewResourceBtn = () => {
  const { data: resourceTypes } = api.resources.getResourceTypes.useQuery()
  const { data: resourceTopics } = api.resources.getResourceTopics.useQuery()
  const { data: resourceTabs } = api.resources.getResourceTabs.useQuery()

  const {
    register,
    handleSubmit,
    watch,
    setValue: setFormValue,
    formState: { errors },
  } = useForm<AddNewResourceSchemaType>({
    resolver: zodResolver(AddNewResourceSchema),
  })

  const selectedTopic = watch('topic')

  const onSubmit = (data: AddNewResourceSchemaType) => {
    console.log('Form submitted successfully:', data)
  }

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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. 'React Hooks' or 'Leetcode 100'"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="url">Link</Label>
              <Input
                id="url"
                placeholder="e.g. 'https://reactjs.org/docs/hooks-intro.html'"
                {...register('url')}
              />
              {errors.url && <p className="text-sm text-red-500">{errors.url.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tab">Tab</Label>
              <Select
                onValueChange={(value) => {
                  setFormValue('tab', Number(value))
                }}
              >
                <SelectTrigger id="tab">
                  <SelectValue placeholder="Select a tab">
                    {resourceTabs?.find((tab) => Number(tab.value) === watch('tab'))?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {resourceTabs?.map((tab) => (
                    <SelectItem
                      key={tab.value}
                      value={tab.value.toString()}
                    >
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tab && <p className="text-sm text-red-500">{errors.tab.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(value) => {
                  setFormValue('type', Number(value))
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes?.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value.toString()}
                    >
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="topic">Topic</Label>
              <TopicSelector
                topics={resourceTopics || []}
                selectedTopic={selectedTopic}
                onTopicSelect={(topic) => setFormValue('topic', topic)}
              />
              {errors.topic && <p className="text-sm text-red-500">{errors.topic.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contributor">Contributor</Label>
              <Input
                id="contributor"
                placeholder="e.g. 'John Doe'"
                {...register('contributor')}
              />
              <p className="text-muted-foreground text-sm">This will be displayed as the author of the resource.</p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Add Resource</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
