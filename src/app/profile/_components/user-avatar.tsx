"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CircleUserRoundIcon } from "lucide-react"
import { UploadButton } from "@/utils/uploadthing"
import { toast } from "sonner"
import { successToastStyle, errorToastStyle } from "@/app/_components/toast-styles"

export const UserAvatar = ({ avatar }: { avatar: string | null }) => {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatar)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="items-center justify-center flex flex-col align-top">
        <div
          className="border-input relative w-26 flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-md border"
          aria-label={
            previewUrl ? "Preview of uploaded image" : "Default user avatar"
          }
        >
          {previewUrl ? (
            <img
              className="size-full object-cover"
              src={previewUrl}
              alt="Preview of uploaded image"
              width={30}
              height={30}
            />
          ) : (
            <div aria-hidden="true">
              <CircleUserRoundIcon className="opacity-60" size={20} />
            </div>
          )}
        </div>
        <div className="relative w-full pt-2 inline-flex items-center justify-center">
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              if (res && res.length > 0) {
                setPreviewUrl(res[0].ufsUrl)
                toast("Avatar updated successfully!", {
                  style: successToastStyle
                })
                router.refresh()
              }
            }}
            onUploadError={(error: Error) => {
              toast(`Upload failed: ${error.message}`, {
                style: errorToastStyle
              })
            }}
            className="w-full"
            appearance={{
              button:
                "ut-ready:bg-secondary w-full ut-ready:text-secondary-foreground text-sm ut-uploading:cursor-not-allowed bg-secondary bg-none ut-uploading:bg-secondary w-24 h-6",
              container: "w-24 h-fit rounded-md border-cyan-300",
              allowedContent:
                "flex h-6 flex-col items-center w-full justify-center px-2 text-white",
            }}
          />
        </div>
      </div>
    </div>
  )
}
