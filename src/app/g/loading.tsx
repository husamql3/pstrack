import { LoaderCircle } from 'lucide-react'

const Loading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <LoaderCircle className="h-8 w-8 animate-spin" />
    </div>
  )
}

export default Loading
