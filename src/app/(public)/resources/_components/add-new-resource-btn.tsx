'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/ui/dialog'
import { PlusIcon, Loader2 } from 'lucide-react'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { api } from '@/trpc/react'
import { useForm } from 'react-hook-form'
import { type AddNewResourceSchemaType, AddNewResourceSchema } from '@/types/schema/resources.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { errorToastStyle, successToastStyle } from '@/app/_components/toast-styles'
import { useState } from 'react'

export const AddNewResourceBtn = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: resourceTypes, isLoading: isResourceTypesLoading } = api.resources.getResourceTypes.useQuery()
  const { data: resourceTopics, isLoading: isResourceTopicsLoading } = api.resources.getResourceTopics.useQuery()
  const { data: resourceTabs, isLoading: isResourceTabsLoading } = api.resources.getResourceTabs.useQuery()
  const { mutate: addNewResource } = api.resources.addResource.useMutation({
    onSuccess: () => {
      toast.success('Resource added successfully and is awaiting admin review.', { style: successToastStyle })
      setIsDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.message, { style: errorToastStyle })
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue: setFormValue,
    formState: { errors },
    reset,
  } = useForm<AddNewResourceSchemaType>({
    resolver: zodResolver(AddNewResourceSchema),
  })

  const onSubmit = (data: AddNewResourceSchemaType) => {
    addNewResource(data)
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(!!open)
      }}
    >
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
        <DialogTitle>Share a Learning Resource</DialogTitle>

        <DialogDescription>Share a valuable resource to help others learn and grow in their journey.</DialogDescription>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Resource Title</Label>
              <Input
                id="title"
                placeholder="e.g. 'Mastering React Hooks'"
                {...register('title')}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="url">Resource URL</Label>
              <Input
                id="url"
                placeholder="e.g. 'https://react.dev/learn/react-hooks'"
                {...register('url')}
              />
              {errors.url && <p className="text-sm text-red-500">{errors.url.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tab">Category</Label>
              <Select
                disabled={isResourceTabsLoading}
                value={watch('tab') || ''}
                onValueChange={(value) => {
                  setFormValue('tab', value)
                }}
              >
                <SelectTrigger id="tab">
                  <SelectValue placeholder={isResourceTabsLoading ? 'Loading categories...' : 'Select a category'}>
                    {isResourceTabsLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      resourceTabs?.find((tab) => tab.value.toString() === watch('tab'))?.label
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isResourceTabsLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    resourceTabs?.map((tab) => (
                      <SelectItem
                        key={tab.value}
                        value={tab.value.toString()}
                      >
                        {tab.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.tab && <p className="text-sm text-red-500">{errors.tab.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select
                disabled={isResourceTypesLoading}
                value={watch('type') || ''}
                onValueChange={(value) => {
                  setFormValue('type', value)
                }}
              >
                <SelectTrigger id="type">
                  <SelectValue
                    placeholder={isResourceTypesLoading ? 'Loading resource types...' : 'Select a resource type'}
                  >
                    {isResourceTypesLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      resourceTypes?.find((type) => type.value.toString() === watch('type'))?.label
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isResourceTypesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    resourceTypes?.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value.toString()}
                      >
                        {type.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Select
                disabled={isResourceTopicsLoading}
                value={watch('topic') || ''}
                onValueChange={(value) => {
                  setFormValue('topic', value)
                }}
              >
                <SelectTrigger id="topic">
                  <SelectValue placeholder={isResourceTopicsLoading ? 'Loading topics...' : 'Select a topic'}>
                    {isResourceTopicsLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      resourceTopics?.find((topic) => topic.topic === watch('topic'))?.topic
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {isResourceTopicsLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    resourceTopics?.map((topic) => (
                      <SelectItem
                        key={topic.topic}
                        value={topic.topic}
                      >
                        {topic.topic}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.topic && <p className="text-sm text-red-500">{errors.topic.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="contributor">Contributor GitHub Username</Label>
              <Input
                id="contributor"
                placeholder="e.g. 'janesmith123'"
                {...register('contributor')}
              />
              <p className="text-muted-foreground text-xs">
                Your GitHub username will be displayed as the author of the resource.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Submit Resource</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
