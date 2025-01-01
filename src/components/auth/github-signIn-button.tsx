import { Button } from '@/components/ui/button'
import { LuGithub } from 'react-icons/lu'

const GithubSigninButton = () => {
  return (
    <form>
      <Button
        variant="outline"
        className="w-full"
      >
        <LuGithub />
        <span>Sign in with GitHub</span>
      </Button>
    </form>
  )
}

export default GithubSigninButton
