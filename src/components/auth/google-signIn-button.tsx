import { Button } from '@/components/ui/button'
import { IoLogoGoogle } from 'react-icons/io5'

const GoogleSigninButton = () => {
  return (
    <form>
      <Button
        variant="outline"
        className="w-full"
      >
        <IoLogoGoogle />
        <span>Sign in with Google</span>
      </Button>
    </form>
  )
}

export default GoogleSigninButton
