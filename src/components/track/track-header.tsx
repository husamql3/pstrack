'use client'

import { Button } from '@/components/ui/button'
import CreateProblemButton from '@/components/components/create-problem-button'

const TrackHeader = () => {
  return (
    <div className="flex items-center justify-between p-4">
      <p>Group 1</p>

      <Button size="sm">Request to join</Button>

      <CreateProblemButton />
    </div>
  )
}

export default TrackHeader
