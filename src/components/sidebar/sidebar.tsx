import Logo from '@/components/components/logo'
import UserMenu from '@/components/sidebar/user-menu'

const Sidebar = () => {
  return (
    <aside className="flex flex-col items-center justify-between py-5 pl-2 pr-1">
      <Logo />
      <UserMenu />
    </aside>
  )
}

export default Sidebar
