import { utapi } from '@/server/uploadthing'
import { api } from '@/trpc/server'
import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: '2MB',
      maxFileCount: 1,
    },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async () => {
      const user = await api.auth.getUser()
      if (!user) throw new UploadThingError('Unauthorized')

      // Return the user ID for the upload process
      console.log({
        userId: user.id,
        oldAvatar: user.leetcoder?.avatar,
      })
      return {
        userId: user.id,
        oldAvatar: user.leetcoder?.avatar,
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log({
        metadata,
        file,
      })
      try {
        // Delete old avatar if it exists
        if (metadata.oldAvatar) {
          try {
            // Extract the file key from the URL
            const fileKey = metadata.oldAvatar.split('/').pop()
            if (fileKey) {
              await utapi.deleteFiles(fileKey)
            } else {
              console.error('Could not extract file key from avatar URL')
            }
          } catch (error) {
            console.error('Failed to delete old avatar:', error)
          }
        }

        // Update the user's avatar
        await api.leetcoders.updateAvatar({
          id: metadata.userId,
          avatarUrl: file.ufsUrl,
        })

        console.log('Upload complete for userId:', metadata.userId)
        console.log('file url', file.ufsUrl)

        return { uploadedBy: metadata.userId }
      } catch (error) {
        console.error('Error in onUploadComplete:', error)
        throw new UploadThingError(error instanceof Error ? error.message : 'Failed to update avatar')
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
