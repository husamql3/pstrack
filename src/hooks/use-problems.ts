import { Problem } from '@/types/table.type'

const useProblem = () => {
  const createProblem = async (problem: Problem) => {
    try {
      const response = await fetch('/api/problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(problem),
      })

      if (!response.ok) {
        throw new Error('Failed to create problem')
      }
    } catch (error) {
      console.error('Error creating problem:', error)
      throw error
    }
  }

  return { createProblem }
}

export default useProblem
