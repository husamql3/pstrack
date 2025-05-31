'use client'

// import { useCallback, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { toast } from 'sonner'

// import { errorToastStyle, infoToastStyle, loadingToastStyle, successToastStyle } from '@/app/_components/toast-styles'
// import { api } from '@/trpc/react'
import { cn } from '@/utils/cn'

// import { Button } from '@/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/ui/dialog'
// import { type FormDataType, RequestForm } from '@/app/group/_components/request-form'
import { PlusIcon } from 'lucide-react'
import { Label } from '@/ui/label'
import { Input } from '@/ui/input'

export const AddNewResourceBtn = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center justify-center">
          <div
            className={cn(
              'group mr-3 rounded-lg border border-white/5 bg-neutral-900 text-base text-neutral-200 transition-all ease-in hover:cursor-pointer hover:bg-neutral-800'
            )}
          >
            <div className="inline-flex items-center justify-center px-4 py-2 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
              <span>Add Resource</span>
              <PlusIcon className="ml-1 size-4" />
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="w-full">
        <DialogTitle>Share a resource with the community</DialogTitle>

        <DialogDescription>Share your expertise with the community.</DialogDescription>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Description</Label>
            <Input />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Link</Label>
            <Input />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
