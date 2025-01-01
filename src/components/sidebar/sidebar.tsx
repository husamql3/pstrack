import { getUser } from '@/hooks/get-user'

import Logo from '@/components/components/logo'
import UserMenu from '@/components/sidebar/user-menu'

const Sidebar = async () => {
  const user = await getUser()

  return (
    <aside className="flex flex-col items-center justify-between px-3 py-5">
      <Logo />
      {user ? <UserMenu email={user.email!} /> : null}
    </aside>
  )
}

export default Sidebar
