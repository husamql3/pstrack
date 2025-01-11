const Page = async ({ params }: { params: Promise<{ groupId: string }> }) => {
  const groupId = Number((await params).groupId)

  return (
    <div>
      <h1>Group</h1>
    </div>
  )
}

export default Page
