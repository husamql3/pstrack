'use server'

import { createClient } from '@/db/supabase/server'
import { Problem } from '@/types/table.type'
import { CreateProblemDto, CreateProblemInput } from '@/types/dto/problem.dto'

export const getProblems = async (): Promise<Problem[] | undefined> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('pNumber', { ascending: true })

    if (error) {
      console.error('getProblems error:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('getProblems error:', error)
  }
}

export const getProblem = async (pNumber: number): Promise<Problem | undefined> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('pNumber', pNumber)
      .single()

    if (error) {
      console.error('getProblem error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('getProblem error:', error)
  }
}

export const createProblem = async (
  problem: CreateProblemInput
): Promise<Problem | undefined> => {
  try {
    const validatedProblem = CreateProblemDto.parse(problem)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('problems')
      .insert([validatedProblem])
      .select()
      .single()

    if (error) {
      console.error('createProblem error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('createProblem error:', error)
  }
}

export const deleteProblem = async (pNumber: number): Promise<Problem | undefined> => {
  if (!pNumber) {
    console.error('pNumber is required')
    return undefined
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('problems')
      .delete()
      .eq('pNumber', pNumber)
      .single()

    if (error) {
      console.error('deleteProblem error:', error)
      return undefined
    }

    return data
  } catch (error) {
    console.error('deleteProblem error:', error)
  }
}
