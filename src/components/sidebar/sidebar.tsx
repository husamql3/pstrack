import Logo from '@/components/components/logo'
import UserMenu from '@/components/sidebar/user-menu'

const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center justify-between px-2 py-5">
      <Logo />
      <UserMenu />
    </aside>
  )
}

export default Sidebar
