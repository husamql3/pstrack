// todo: update group no style

import { UserAuth } from '@/app/_components/user-auth'
import { Button } from '@/components/ui/button'

export const GroupHeader = ({ groupNo }: { groupNo: string }) => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group #{groupNo}</h1>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="secondary">Request to join</Button>

        <UserAuth />
      </div>
    </header>
  )
}
