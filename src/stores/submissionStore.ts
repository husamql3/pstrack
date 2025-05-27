import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubmissionKey = string // Format: `${groupId}:${userId}:${problemId}`

type SubmissionData = {
  solved: boolean
  created_at: string
}

type SubmissionStore = {
  submissions: Record<SubmissionKey, SubmissionData | boolean>
  hasPendingSubmission: boolean // Track if current user has any pending submission
  setSubmission: (key: SubmissionKey, value: boolean) => void
  isSubmitted: (key: SubmissionKey) => boolean
  getSubmissionDate: (key: SubmissionKey) => Date | null
  setPendingSubmission: (pending: boolean) => void
}

export const useSubmissionStore = create<SubmissionStore>()(
  persist(
    (set, get) => ({
      submissions: {},
      hasPendingSubmission: false,
      setSubmission: (key, value) =>
        set((state) => ({
          submissions: {
            ...state.submissions,
            [key]: {
              solved: value,
              created_at: new Date().toISOString(),
            },
          },
        })),
      isSubmitted: (key) => {
        const submission = get().submissions[key]
        // Handle backward compatibility - if it's a boolean, convert it
        if (typeof submission === 'boolean') {
          return submission
        }
        return !!submission?.solved
      },
      getSubmissionDate: (key) => {
        const submission = get().submissions[key]
        // Handle backward compatibility - if it's a boolean, return null
        if (typeof submission === 'boolean') {
          return null
        }
        return submission ? new Date(submission.created_at) : null
      },
      setPendingSubmission: (pending) =>
        set({
          hasPendingSubmission: pending,
        }),
    }),
    {
      name: 'submissions-storage',
      // Don't persist hasPendingSubmission as it should reset on page reload
      partialize: (state) => ({ submissions: state.submissions }),
    }
  )
)