import { useRouter } from 'next/navigation'
import { IoExitOutline } from 'react-icons/io5'
import { toast } from 'sonner'
import { signOut } from '@/supabase/auth.service'
import { DropdownMenuItem } from '@/ui/dropdown-menu'

export const LogoutBtn = () => {
  const router = useRouter()

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      toast.error(error.message)
      return
    }

    router.push('/login')
  }

  return (
    <DropdownMenuItem onClick={() => handleSignOut()}>
      <IoExitOutline
        size={16}
        className="opacity-60"
      />
      <span className="ml-2">Logout</span>
    </DropdownMenuItem>
  )
}
