'use client'

import type { groups, leetcoders } from '@prisma/client'
import { Globe, Loader2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { FaLinkedin, FaXTwitter } from 'react-icons/fa6'
import { LuGithub } from 'react-icons/lu'
import { toast } from 'sonner'
import { errorToastStyle, successToastStyle } from '@/app/_components/toast-styles'
import { api } from '@/trpc/react'
import type { UpdateLeetcoderInput } from '@/types/leetcoders.type'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Switch } from '@/ui/switch'
import { UserAvatar } from './user-avatar'

export const UserForm = ({ leetcoder, groups }: { leetcoder: leetcoders; groups: groups[] }) => {
  const router = useRouter()

  const { mutate: updateLeetcoder, isPending: isUpdatingLeetcoder } = api.leetcoders.update.useMutation({
    onSuccess: (updatedData) => {
      toast.success('Profile updated successfully', {
        style: successToastStyle,
      })
      reset({
        id: leetcoder.id,
        group_no: updatedData.group_no ?? leetcoder.group_no,
        is_visible: updatedData.is_visible ?? leetcoder.is_visible,
        website: updatedData.website ?? '',
        gh_username: updatedData.gh_username ?? '',
        x_username: updatedData.x_username ?? '',
        li_username: updatedData.li_username ?? '',
      })
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile', {
        style: errorToastStyle,
      })
    },
  })

  const { mutate: changeGroup, isPending: isUpdatingGroup } = api.leetcoders.changeGroup.useMutation({
    onSuccess: async () => {
      toast.success('Group changed successfully', {
        style: successToastStyle,
      })
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change group', {
        style: errorToastStyle,
      })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<UpdateLeetcoderInput>({
    defaultValues: {
      group_no: leetcoder.group_no,
      is_visible: leetcoder.is_visible,
      website: leetcoder.website ?? '',
      gh_username: leetcoder.gh_username ?? '',
      x_username: leetcoder.x_username ?? '',
      li_username: leetcoder.li_username ?? '',
    },
  })

  const watchedGroupNo = watch('group_no')
  const groupChanged = watchedGroupNo !== leetcoder.group_no

  const onSubmit = async (data: UpdateLeetcoderInput) => {
    if (groupChanged) {
      changeGroup({
        userId: leetcoder.id,
        newGroupNo: Number(data.group_no),
      })
      return
    }

    // Process website URL
    if (data.website && data.website.trim() !== '') {
      if (!isValidUrl(data.website)) {
        toast.error('Please enter a valid website URL', {
          style: errorToastStyle,
        })
        return
      }
    }

    // Process social media usernames
    if (data?.gh_username?.includes('github.com')) {
      data.gh_username = extractUsername(data.gh_username, 'github')
    }

    if (data?.x_username?.includes('twitter.com') || data?.x_username?.includes('x.com')) {
      data.x_username = extractUsername(data.x_username, 'twitter')
    }

    if (data?.li_username?.includes('linkedin.com')) {
      data.li_username = extractUsername(data.li_username, 'linkedin')
    }

    updateLeetcoder({
      ...data,
      group_no: data.group_no?.toString(),
    })
  }

  const handleGroupChange = (value: string) => {
    setValue('group_no', Number(value), { shouldDirty: true })
  }

  const handleVisibilityChange = (checked: boolean) => {
    setValue('is_visible', checked, { shouldDirty: true })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Basic Information</h2>

        <div className="flex items-center justify-between gap-6">
          <div className="mt-3 flex-1 space-y-5">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3 text-zinc-500">
                  @
                </div>
                <Input
                  value={leetcoder.username}
                  className="peer relative z-10 ps-7 dark:dark:bg-zinc-950"
                  disabled
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={leetcoder.name}
                className="relative z-10 dark:bg-zinc-950"
                disabled
              />
            </div>
          </div>

          <UserAvatar avatar={leetcoder.avatar} />
        </div>

        <div className="space-y-2">
          <Label>LeetCode Username</Label>
          <Input
            value={leetcoder.lc_username}
            className="relative z-10 dark:bg-zinc-950"
            disabled
          />
        </div>
      </div>

      <hr className="border-zinc-800" />

      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Social Media</h2>
        <div className="space-y-2">
          <Label>GitHub Username</Label>
          <div className="relative">
            <Input
              {...register('gh_username')}
              className="peer relative z-10 ps-9 dark:bg-zinc-950"
              placeholder="username or full URL"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
              <LuGithub
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Twitter Username</Label>
          <div className="relative">
            <Input
              {...register('x_username')}
              className="peer relative z-10 ps-9 dark:bg-zinc-950"
              placeholder="username or full URL"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
              <FaXTwitter
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>LinkedIn Username</Label>
          <div className="relative">
            <Input
              {...register('li_username')}
              className="peer relative z-10 ps-9 dark:bg-zinc-950"
              placeholder="username or full URL"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
              <FaLinkedin
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Personal Website</Label>
          <div className="relative">
            <Input
              {...register('website')}
              className="peer relative z-10 ps-9 dark:bg-zinc-950"
              placeholder="https://your-website.com"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
              <Globe
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-zinc-800" />

      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Visibility Settings</h2>
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label>Show in Leetcoder Card</Label>
            <p className="text-sm text-zinc-500">
              Show this information in the group table while hovering on your username
            </p>
          </div>
          <Switch
            checked={watch('is_visible')}
            onCheckedChange={handleVisibilityChange}
            defaultChecked={leetcoder.is_visible}
          />
        </div>
      </div>

      <hr className="border-zinc-800" />

      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Group Settings</h2>
        <div className="space-y-2">
          <Label>Current Group</Label>
          <div className="relative">
            <Select onValueChange={handleGroupChange}>
              <SelectTrigger className="relative z-10 ps-9 dark:bg-zinc-950">
                <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
                  <Users
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <SelectValue placeholder={`Group ${String(leetcoder.group_no)}`} />
              </SelectTrigger>
              <SelectContent>
                {groups.length > 0 ? (
                  groups
                    .sort((a, b) => a.group_no - b.group_no)
                    .map((group) => (
                      <SelectItem
                        key={group.id}
                        value={String(group.group_no)}
                      >
                        Group {group.group_no}
                      </SelectItem>
                    ))
                ) : (
                  <SelectItem
                    value="none"
                    disabled
                  >
                    No groups to join yet, check back soon!
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-zinc-500">Change your group to join different group</p>
          {groupChanged && (
            <p className="text-sm text-amber-500">
              Note: <br />
              Changing your group will reset your solved problems in the new group.
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset()}
          disabled={!isDirty || isUpdatingGroup || isUpdatingLeetcoder}
          className="cursor-pointer"
        >
          Reset Changes
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isUpdatingGroup || isUpdatingLeetcoder}
          className="cursor-pointer"
        >
          {isUpdatingLeetcoder || isUpdatingGroup ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}

const extractUsername = (url: string, type: 'github' | 'twitter' | 'linkedin'): string => {
  try {
    const urlObj = new URL(url)

    if (type === 'github' && urlObj.hostname.includes('github.com')) {
      // Extract username from github.com/username
      return urlObj.pathname.split('/')[1] || ''
    } else if (type === 'twitter' && (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com'))) {
      // Extract username from twitter.com/username or x.com/username
      return urlObj.pathname.split('/')[1] || ''
    } else if (type === 'linkedin' && urlObj.hostname.includes('linkedin.com')) {
      // Extract username from linkedin.com/in/username
      const parts = urlObj.pathname.split('/')
      return parts.length > 2 && parts[1] === 'in' ? parts[2] : ''
    }

    return url
  } catch {
    return url
  }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
