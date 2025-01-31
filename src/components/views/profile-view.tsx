'use client'

import { useState } from 'react'
import { leetcoders } from '@prisma/client'
import { AtSign } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const ProfileView = ({ user }: { user: leetcoders }) => {
  const [isPending, setIsPending] = useState(false)

  const updateProfile = async (formData: FormData) => {
    setIsPending(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        console.log(data)
        toast({
          description: data.error,
          variant: 'destructive',
        })
      } else {
        toast({
          description: 'Profile updated successfully',
          variant: 'success',
        })
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        description: 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsPending(false)
    }
  }

  const { username, group_no, name, lc_username, gh_username, x_username, li_username } = user

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    await updateProfile(formData)
  }

  return (
    <div className="space-y-3 py-10">
      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        {/* Username & Group Number */}
        <div className="flex flex-1 gap-3">
          <div className="flex-1">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                className="peer ps-9"
                defaultValue={username}
                disabled
              />
              <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                <AtSign
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Group Number</Label>
            <Select disabled>
              <SelectTrigger className="w-[180px]">
                <SelectValue
                  placeholder={'Group ' + group_no}
                  defaultValue={group_no}
                />
              </SelectTrigger>
            </Select>
          </div>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={name}
          />
        </div>

        {/* LeetCoder & GitHub usernames  */}
        <div className="flex w-full gap-3">
          <div className="flex-1">
            <Label htmlFor="lc_username">LeetCode Username</Label>
            <Input
              id="lc_username"
              name="lc_username"
              defaultValue={lc_username || ''}
            />
          </div>

          <div className="flex-1">
            <Label htmlFor="gh_username">GitHub Username</Label>
            <Input
              id="gh_username"
              name="gh_username"
              defaultValue={gh_username || ''}
            />
          </div>
        </div>

        {/* Twitter username */}
        <div>
          <Label htmlFor="x_username">Twitter Username</Label>
          <div className="flex">
            <span className="-z-10 inline-flex items-center rounded-s-lg border border-r-0 border-zinc-800 px-3 text-sm text-zinc-50 opacity-50">
              x.com/
            </span>
            <Input
              id="x_username"
              name="x_username"
              className="-ms-px rounded-s-none shadow-none"
              type="text"
              defaultValue={x_username || ''}
            />
          </div>
        </div>

        {/* LinkedIn username */}
        <div>
          <Label htmlFor="li_username">LinkedIn Username</Label>
          <div className="flex">
            <span className="-z-10 inline-flex items-center rounded-s-lg border border-r-0 border-zinc-800 px-3 text-sm text-zinc-50 opacity-50">
              linkedin.com/in/
            </span>
            <Input
              id="li_username"
              name="li_username"
              className="-ms-px rounded-s-none shadow-none"
              type="text"
              defaultValue={li_username || ''}
            />
          </div>
        </div>

        {/* User ID */}
        <input
          type="hidden"
          name="id"
          value={user.id}
        />

        <div className="flex w-full justify-end pt-4">
          <Button
            type="submit"
            disabled={isPending}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfileView
