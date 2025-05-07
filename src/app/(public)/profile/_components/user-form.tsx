import type { leetcoders, groups } from "@prisma/client"
import { AtSign, Globe, Users,} from "lucide-react"
import { LuGithub,  } from "react-icons/lu"
import { FaLinkedin, FaXTwitter } from "react-icons/fa6"

import { Input } from "@/ui/input"
import { Label } from "@/ui/label"
import { Switch } from "@/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select"

export const UserForm = ({ leetcoder, groups }: { leetcoder: leetcoders, groups: groups[] }) => {
  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Basic Information</h2>
        <div className="space-y-2">
          <Label>Username</Label>
          <div className="relative">
            <Input
              id="username"
              name="username"
              className="peer ps-9 bg-zinc-950 relative z-10"
              defaultValue={leetcoder.username}
              disabled
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50 z-20">
              <AtSign
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            id="name"
            name="name"
            className="bg-zinc-950 relative z-10"
            defaultValue={leetcoder.name}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label>LeetCode Username</Label>
          <Input
            id="lc_username"
            name="lc_username"
            className="bg-zinc-950 relative z-10"
            defaultValue={leetcoder.lc_username}
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
              id="gh_username"
              name="gh_username"
              className="peer ps-9 bg-zinc-950 relative z-10"
              defaultValue={leetcoder.gh_username ?? ""}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 z-20">
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
              id="x_username"
              name="x_username"
              className="peer ps-9 bg-zinc-950 relative z-10"
              defaultValue={leetcoder.x_username ?? ""}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 z-20">
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
              id="li_username"
              name="li_username"
              className="peer ps-9 bg-zinc-950 relative z-10"
              defaultValue={leetcoder.li_username ?? ""}
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 z-20">
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
              id="website"
              name="website"
              className="peer ps-9 bg-zinc-950 relative z-10"
              defaultValue={""}
              placeholder="https://your-website.com"
            />
            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 z-20">
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
            id="show_in_card"
            name="show_in_card"
            defaultChecked={false}
          />
        </div>
      </div>

      <hr className="border-zinc-800" />

      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Group Settings</h2>
        <div className="space-y-2">
          <Label>Current Group</Label>
          <div className="relative">
            <Select defaultValue={leetcoder.group_no.toString()}>
              <SelectTrigger className="ps-9 bg-zinc-950 relative z-10">
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 z-20">
                  <Users size={16} strokeWidth={2} aria-hidden="true" />
                </div>
                <SelectValue placeholder="Select a group" />
              </SelectTrigger>
              <SelectContent>
                {groups
                  .sort((a, b) => a.group_no - b.group_no)
                  .map((group) => (
                    <SelectItem key={group.id} value={String(group.group_no)}>
                      Group {group.group_no}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-zinc-500">
            Change your group to join different study groups
          </p>
        </div>
      </div>
    </div>
  )
}