import { Hero } from '@/app/_components/hero'
import { api } from '@/trpc/server'

export default async function Home() {
  // todo: remove
  const user = await api.auth.getUser()
  console.log(user)
  return <Hero />
}
