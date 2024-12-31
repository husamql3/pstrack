import Sidebar from '@/components/sidebar/sidebar'
import Table from '@/components/components/table'

const Home = () => {
  return (
    <div className="flex h-svh w-svw overflow-hidden">
      <Sidebar />
      <Table />
    </div>
  )
}

export default Home
