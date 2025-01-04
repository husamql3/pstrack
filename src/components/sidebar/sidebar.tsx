// import Link from 'next/link'
// import { LogIn } from 'lucide-react'
// import { User } from '@supabase/auth-js'
//
// import { Logo } from '@/components/components/logo'
// import UserMenu from '@/components/sidebar/user-menu'
// import { Button } from '@/components/ui/button'
//
// const Sidebar = async ({ user }: { user: User }) => {
//   return (
//     <aside className="flex flex-col items-center justify-between px-3 py-5">
//       <Logo />
//
//       {user ? (
//         <UserMenu user={user} />
//       ) : (
//         <Link
//           href="/login"
//           prefetch
//         >
//           <Button className="h-10 w-10 rounded-full">
//             <LogIn
//               size={18}
//               className="h-10 w-10"
//             />
//           </Button>
//         </Link>
//       )}
//     </aside>
//   )
// }
//
// export default Sidebar
