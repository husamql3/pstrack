import { Footer } from './_components/footer'
import { Hero } from './_components/hero'
import { Header } from './_components/header'

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <Hero />
      <Footer />
    </div>
  )
}
