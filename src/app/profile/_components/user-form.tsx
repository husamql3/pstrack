"use client"

import type { leetcoders, groups } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { Globe, Users } from 'lucide-react'
import { LuGithub } from 'react-icons/lu'
import { FaLinkedin, FaXTwitter } from 'react-icons/fa6'

import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select'
import { Button } from '@/ui/button'

// Only include fields that are editable in the form
type EditableLeetcoderFields = Pick<
  leetcoders,
  | 'gh_username'
  | 'x_username'
  | 'li_username'
  | 'group_no'
  | 'website'
  | 'is_visible'
>

export const UserForm = ({ leetcoder, groups }: { leetcoder: leetcoders; groups: groups[] }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty }
  } = useForm<EditableLeetcoderFields>({
    defaultValues: {
      gh_username: leetcoder.gh_username,
      x_username: leetcoder.x_username,
      li_username: leetcoder.li_username,
      group_no: leetcoder.group_no,
      website: leetcoder.website,
      is_visible: leetcoder.is_visible
    }
  })

  const onSubmit = async (data: EditableLeetcoderFields) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <div className="space-y-2">
          <Label>Username</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3 text-zinc-500">
              @
            </div>
            <Input
              value={leetcoder.username}
              className="peer relative z-10 bg-zinc-950 ps-7"
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            value={leetcoder.name}
            className="relative z-10 bg-zinc-950"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label>LeetCode Username</Label>
          <Input
            value={leetcoder.lc_username}
            className="relative z-10 bg-zinc-950"
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
              className="peer relative z-10 bg-zinc-950 ps-9"
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
              className="peer relative z-10 bg-zinc-950 ps-9"
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
              className="peer relative z-10 bg-zinc-950 ps-9"
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
              className="peer relative z-10 bg-zinc-950 ps-9"
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
            {...register('is_visible')}
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
            <Select {...register('group_no')} defaultValue={leetcoder.group_no.toString()}>
              <SelectTrigger className="relative z-10 bg-zinc-950 ps-9">
                <div className="pointer-events-none absolute inset-y-0 start-0 z-20 flex items-center justify-center ps-3">
                  <Users
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .sort((a, b) => a.group_no - b.group_no)
                  .map((group) => (
                    <SelectItem
                      key={group.id}
                      value={String(group.group_no)}
                    >
                      Group {group.group_no}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-zinc-500">Change your group to join different study groups</p>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset()}
          disabled={!isDirty}
        >
          Reset Changes
        </Button>
        <Button
          type="submit"
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </div>
    </form>
  )
}
