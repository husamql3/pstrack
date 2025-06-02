'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/ui/dialog'
import { PlusIcon, Loader2, X } from 'lucide-react'
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
  const [isCreatingNewTopic, setIsCreatingNewTopic] = useState(false)

  const { data: resourceTypes, isLoading: isResourceTypesLoading } = api.resources.getResourceTypes.useQuery()
  const { data: resourceTopics, isLoading: isResourceTopicsLoading } = api.resources.getResourceTopics.useQuery()
  const { data: resourceTabs, isLoading: isResourceTabsLoading } = api.resources.getResourceTabs.useQuery()
  const { mutate: addNewResource, isPending: isAddingNewResource } = api.resources.addResource.useMutation({
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
        if (!open) {
          setIsCreatingNewTopic(false)
        }
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
              {isCreatingNewTopic ? (
                <div className="relative">
                  <Input
                    id="topic"
                    placeholder="Enter new topic name"
                    {...register('topic')}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 p-0"
                    onClick={() => {
                      setIsCreatingNewTopic(false)
                      setFormValue('topic', '')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  disabled={isResourceTopicsLoading}
                  value={watch('topic') || ''}
                  onValueChange={(value) => {
                    if (value === '__create_new__') {
                      setIsCreatingNewTopic(true)
                      setFormValue('topic', '')
                    } else {
                      setFormValue('topic', value)
                    }
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
                  <SelectContent className="max-h-[250px] overflow-y-auto">
                    {isResourceTopicsLoading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <>
                        <SelectItem
                          value="__create_new__"
                          className="border-border/50 relative border-b bg-gradient-to-r from-emerald-50 to-teal-50 font-semibold text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:text-emerald-800 focus:from-emerald-100 focus:to-teal-100 focus:text-emerald-800 dark:from-emerald-950/30 dark:to-teal-950/30 dark:text-emerald-400 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 dark:hover:text-emerald-300 dark:focus:from-emerald-950/50 dark:focus:to-teal-950/50 dark:focus:text-emerald-300"
                        >
                          <div className="flex items-center gap-2 py-1">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800">
                              <PlusIcon className="h-3 w-3 text-emerald-700 dark:text-emerald-300" />
                            </div>
                            <span>Create new topic</span>
                          </div>
                        </SelectItem>
                        {resourceTopics?.map((topic) => (
                          <SelectItem
                            key={topic.topic}
                            value={topic.topic}
                          >
                            {topic.topic}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
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
            <Button
              type="submit"
              disabled={isAddingNewResource}
            >
              {isAddingNewResource ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
