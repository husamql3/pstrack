import { LandingBg } from '@/components/landing/landing-bg'
import Header from '@/components/landing/header'
import Footer from '@/components/landing/footer'
import Hero from '@/components/landing/hero'

const Page = () => {
  return (
    <>
      {/* spotlight and grid pattern */}
      <LandingBg />

      <div className="absolute z-10 mx-auto flex h-svh w-full flex-col">
        <Header />
        <Hero />
        <Footer />
      </div>
    </>
  )
}

export default Page
