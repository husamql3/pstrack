export const ResourcesCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-zinc-700/10 bg-gradient-to-tr from-[#141416] to-[#1C1C1C] p-2 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-tr before:from-zinc-900/20 before:to-zinc-800/5 before:opacity-20 after:absolute after:inset-0 after:-z-20 after:[background-size:200px] after:opacity-[0.15] after:mix-blend-overlay">
      {children}
    </div>
  )
}
