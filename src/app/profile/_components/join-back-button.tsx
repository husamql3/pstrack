'use client'

import { LeetcodeStatus } from '@prisma/client'
import { AlertCircle, Loader2, UserCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { errorToastStyle, successToastStyle } from '@/app/_components/toast-styles'
import { PLATFORM_EMAIL } from '@/data/constants'
import { api } from '@/trpc/react'
import { Badge } from '@/ui/badge'
import { Button } from '@/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'

export const JoinBackButton = ({
  userStatus,
  hasSecondChance,
}: {
  userStatus: LeetcodeStatus
  hasSecondChance: boolean
}) => {
  const router = useRouter()
  const utils = api.useUtils()

  const { mutate: requestRejoin, isPending } = api.leetcoders.requestRejoin.useMutation({
    onSuccess: () => {
      toast.success('Rejoin request submitted successfully! You have one more chance to catch up.', {
        style: successToastStyle,
      })
      utils.leetcoders.invalidate()
      utils.auth.invalidate()
      router.refresh()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit rejoin request', {
        style: errorToastStyle,
      })
    },
  })

  const handleRejoinRequest = () => {
    requestRejoin()
  }

  if (userStatus === LeetcodeStatus.PENDING) {
    return (
      <>
        <hr className="border-zinc-800" />

        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg text-amber-800 dark:text-amber-200">Account Pending</CardTitle>
              <Badge
                variant="outline"
                className="text-amber-700"
              >
                Pending Approval
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Your account is currently pending approval. You&apos;ll be able to participate once an admin approves your
              account.
            </CardDescription>
          </CardContent>
        </Card>
      </>
    )
  }

  if (userStatus === LeetcodeStatus.SUSPENDED) {
    return (
      <>
        <hr className="border-zinc-800" />

        <Card className="border-red-800 bg-red-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg text-red-800 dark:text-red-200">Account Suspended</CardTitle>
              <Badge variant="destructive">Suspended</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <CardDescription className="text-red-700 dark:text-red-300">
              Your account has been suspended for not meeting the problem-solving requirements.
              {hasSecondChance
                ? "You've already used your second chance and cannot rejoin at this time."
                : 'You can request to rejoin and get one more chance to catch up with your group.'}
            </CardDescription>

            {!hasSecondChance && (
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
                  <h4 className="mb-1 font-medium text-blue-800 dark:text-blue-200">What happens when you rejoin?</h4>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li>• You&apos;ll get one final chance to catch up</li>
                    <li>• You&apos;ll need to solve the required problems to stay active</li>
                    <li>• If you fall behind again, you won&apos;t be able to rejoin</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRejoinRequest}
                  disabled={isPending}
                  className="flex w-full cursor-pointer items-center"
                  size="lg"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-4" />
                      Request to Rejoin Group
                    </>
                  )}
                </Button>
              </div>
            )}

            {hasSecondChance && (
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-900/50">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You&apos;ve already used your second chance. Please contact an Admin ({PLATFORM_EMAIL}) if you believe
                  this is an error.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  return null
}
