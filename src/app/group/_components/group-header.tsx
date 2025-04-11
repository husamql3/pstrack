// todo: update group no style

import { User } from '@/app/group/_components/user'

export const GroupHeader = ({ groupNo }: { groupNo: string }) => {
  return (
    <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 pt-5 pb-2">
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">Group #{groupNo}</h1>
      </div>

      <User />
    </header>
  )
}
