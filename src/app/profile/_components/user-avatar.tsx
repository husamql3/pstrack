"use client"

import { useState } from "react"
import { CircleUserRoundIcon, X } from "lucide-react"
import { UploadButton } from "@/utils/uploadthing"
import { toast } from "sonner"
import { successToastStyle, errorToastStyle } from "@/app/_components/toast-styles"
import { cn } from "@/utils/cn"

import { Button } from "@/ui/button"
import { api } from "@/trpc/react"

export const UserAvatar = ({ avatar, userId }: { avatar: string | null, userId: string }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar)
  const [imageChanged, setImageChanged] = useState(false)

  const { mutate: updateAvatar } = api.leetcoders.updateAvatar.useMutation({
    onSuccess: () => {
      toast("Avatar updated successfully", {
        style: successToastStyle
      })
      setImageChanged(false)
    },
    onError: (error) => {
      toast(`Failed to update avatar: ${error.message}`, {
        style: errorToastStyle
      })
      setPreviewUrl(avatar)
      setImageChanged(false)
    }
  })

  const handleSaveClick = () => {
    if (previewUrl && userId) {
      updateAvatar({
        id: userId,
        avatarUrl: previewUrl
      })
    }
  }

  const handleCancelClick = () => {
    setPreviewUrl(avatar)
    setImageChanged(false)
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
          {!imageChanged ? (
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  setPreviewUrl(res[0].ufsUrl)
                  setImageChanged(true)
                  toast("Image uploaded successfully", {
                    style: successToastStyle
                  })
                }
              }}
              onUploadError={(error: Error) => {
                toast(`Upload failed: ${error.message}`, {
                  style: errorToastStyle
                })
              }}
              className={cn("w-full", "cursor-pointer")}
            />
          ) : (
            <Button
              variant='secondary'
              type="button"
              className="w-fit cursor-pointer"
              onClick={handleSaveClick}
            >
              Save
            </Button>
          )}
          {imageChanged && (
            <Button
              onClick={handleCancelClick}
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
