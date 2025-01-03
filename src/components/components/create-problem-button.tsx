'use client'

import useProblem from '@/hooks/use-problems'
import { Difficulty } from '@/types/table.type'

import { Button } from '@/components/ui/button'

const CreateProblemButton = () => {
  const { createProblem } = useProblem()

  const problem = {
    id: 4,
    pNumber: 125,
    pLink: 'https://leetcode.com/problems/valid-palindrome',
    pTopic: 'two-pointers',
    difficulty: 'Easy' as Difficulty,
  }

  return (
    <Button
      size="sm"
      onClick={() => createProblem(problem)}
    >
      Create
    </Button>
  )
}

export default CreateProblemButton
