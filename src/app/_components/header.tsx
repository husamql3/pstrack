export const Header = ({ children }: React.PropsWithChildren) => {
  return (
    <header className="mx-auto flex w-full max-w-4xl flex-row items-center justify-between px-3 pt-8 pb-5">
      {children}
    </header>
  )
}
