"use client"

import { CircleUserRoundIcon, X } from "lucide-react"

import { useFileUpload } from "@/hooks/use-file-upload"
import { toast } from "sonner"
import { successToastStyle, errorToastStyle } from "@/app/_components/toast-styles"
import { cn } from "@/utils/cn"

import { Button } from "@/ui/button"

export const UserAvatar = ({ avatar }: { avatar: string | null }) => {

  const [{ files }, { removeFile, openFileDialog, getInputProps }] =
    useFileUpload({
      accept: "image/*",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB limit
    })

  const previewUrl = files[0]?.preview || avatar || null
  const imageChanged = files.length > 0

  const handleSave = async () => {
    if (imageChanged) {
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="items-center justify-center flex flex-col align-top">
        <div
          className="border-input relative w-28 flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-md border"
          aria-label={
            previewUrl ? "Preview of uploaded image" : "Default user avatar"
          }
        >
          {previewUrl ? (
            <img
              className="size-full object-cover"
              src={previewUrl}
              alt="Preview of uploaded image"
              width={32}
              height={32}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRoundIcon className="opacity-60" size={20} />
            </div>
          )}
        </div>
        <div className="relative w-full pt-2 inline-flex items-center gap-2">
          <Button
            onClick={imageChanged ? handleSave : openFileDialog}
            variant='secondary'
            aria-haspopup="dialog"
            type="button"
            className={cn(imageChanged ? "w-fit" : "w-full", "cursor-pointer")}
          >
            {imageChanged ? "Save" : "Upload"}
          </Button>
          <input
            {...getInputProps()}
            className="sr-only"
            aria-label="Upload image file"
            tabIndex={-1}
          />
          {imageChanged && (
            <Button
              onClick={() => removeFile(files[0]?.id)}
              aria-label="Remove avatar"
              variant='destructive'
              type="button"
              className="cursor-pointer"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
