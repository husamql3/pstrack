'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { leetcoders } from '@prisma/client'
import { AtSign } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue } from '@/components/ui/select'

const formSchema = z.object({
  name: z.string().min(2, {}),
  username: z.string(),
  lc_username: z.string(),
  gh_username: z.string().optional(),
  x_username: z.string().optional(),
  li_username: z.string().optional(),
})

const ProfileView = ({ user }: { user: leetcoders }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      lc_username: user.lc_username,
      gh_username: user.gh_username || '',
      x_username: '',
      li_username: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <div className="space-y-3 py-5">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="flex flex-1 gap-3">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>LeetCode username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        className="peer ps-9"
                        {...field}
                        disabled
                      />
                      <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
                        <AtSign
                          size={16}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Group Number</FormLabel>
              <FormControl>
                <Select disabled>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={'Group ' + user.group_no} />
                  </SelectTrigger>
                </Select>
              </FormControl>
            </FormItem>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex w-full gap-3">
            <FormField
              control={form.control}
              name="lc_username"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>LeetCode username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gh_username"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>GitHub username</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="x_username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Twitter Username</FormLabel>
                <FormControl>
                  <div className="flex">
                    <span className="-z-10 inline-flex items-center rounded-s-lg border border-r-0 border-zinc-800 px-3 text-sm">
                      x.com/
                    </span>
                    <Input
                      {...field}
                      className="-ms-px rounded-s-none shadow-none"
                      type="text"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="li_username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn Username</FormLabel>
                <FormControl>
                  <div className="flex">
                    <span className="-z-10 inline-flex items-center rounded-s-lg border border-r-0 border-zinc-800 px-3 text-sm">
                      linkedin.com/in/
                    </span>
                    <Input
                      {...field}
                      className="-ms-px rounded-s-none shadow-none"
                      type="text"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex w-full justify-end pt-4">
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ProfileView
