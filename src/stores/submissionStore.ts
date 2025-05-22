import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SubmissionKey = string // Format: `${leetcoder.group_no}:${leetcoder.id}:${problemId}`

type SubmissionStore = {
  submissions: Record<SubmissionKey, boolean>
  setSubmission: (key: SubmissionKey, value: boolean) => void
  isSubmitted: (key: SubmissionKey) => boolean
}

export const useSubmissionStore = create<SubmissionStore>()(
  persist(
    (set, get) => ({
      submissions: {},
      setSubmission: (key, value) =>
        set((state) => ({
          submissions: {
            ...state.submissions,
            [key]: value,
          },
        })),
      isSubmitted: (key) => !!get().submissions[key],
    }),
    {
      name: 'submissions-storage',
    }
  )
)
