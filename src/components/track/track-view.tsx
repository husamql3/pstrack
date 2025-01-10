'use client'

import { useState, useEffect } from 'react'
import { useSubmitDailyProblem } from '@/hooks/use-submit-daily-problem'
import { TrackViewProps } from '@/types/trackViewProps.type'
import { TrackTable } from '@/components/track/track-table'
import { getColumns } from '@/components/track/track-columns'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

const TrackView = ({ userId, leetcoders, tableData, groupId }: TrackViewProps) => {
  const { submitDailyProblem } = useSubmitDailyProblem()
  const [pendingRequests, setPendingRequests] = useState<Promise<boolean>[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (pendingRequests.length === 0 && isSubmitting) {
      setIsSubmitting(false)
      router.refresh()
    }
  }, [pendingRequests, isSubmitting, router])

  const handleSubmit = async (user_id: string, problem_id: string) => {
    setIsSubmitting(true)

    // Show a loading toast
    toast({
      title: 'Submitting problem...',
      description: 'Please wait while we process your submission.',
      variant: 'default',
    })

    const request = submitDailyProblem({ user_id, problem_id, group_no: groupId })
      .then((result) => {
        if (!result) {
          throw new Error('Failed to submit daily problem')
        }
        // Show success toast
        toast({
          title: 'Success!',
          description: 'Problem submitted successfully!',
          variant: 'success',
        })
        return result
      })
      .catch((error) => {
        console.error('Error submitting daily problem:', error)
        // Show error toast
        toast({
          title: 'Error',
          description: 'Failed to submit problem. Please try again.',
          variant: 'destructive',
        })
        throw error // Re-throw the error to ensure the promise is rejected
      })
      .finally(() => {
        setPendingRequests((prev) => prev.filter((req) => req !== request))
      })

    setPendingRequests((prev) => [...prev, request])
  }

  return (
    <main className="mx-auto max-w-screen-xl py-5">
      <TrackTable
        columns={getColumns(userId ?? undefined, leetcoders, handleSubmit)}
        data={tableData}
      />
    </main>
  )
}

export { TrackView }
