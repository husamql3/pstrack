import Image from 'next/image'

import { Button } from '@/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'

type AvatarGroupProps = {
  avatars: {
    src: string | null
    alt: string
  }[]
  totalCount: number
}

export const AvatarGroup = ({ avatars, totalCount }: AvatarGroupProps) => {
  const displayCount = 6
  const displayedAvatars = avatars.slice(0, displayCount)
  const remainingCount = totalCount - displayCount > 0 ? totalCount - displayCount : 0

  if (totalCount === 0) return <div />

  return (
    <div className="bg-background flex items-center rounded-full border p-1 shadow-sm">
      <div className="flex -space-x-3">
        {displayedAvatars.map((avatar, index) => (
          <Avatar key={avatar.alt}>
            {avatar.src ? (
              <AvatarImage
                src={avatar.src}
                alt={avatar.alt}
              />
            ) : null}
            <AvatarFallback>{avatar.alt.charAt(0)}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      {remainingCount > 0 && (
        <Button
          variant="secondary"
          className="text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full bg-transparent px-3 text-xs shadow-none hover:bg-transparent"
        >
          +{remainingCount}
        </Button>
      )}
    </div>
  )
}
