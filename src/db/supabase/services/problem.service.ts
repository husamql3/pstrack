'use server'

import { createClient } from '@/db/supabase/server'
import { Problem } from '@/types/table.type'
import { CreateProblemInput } from '@/types/dto/problem.dto'

export const getProblems = async (): Promise<Problem[]> => {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('pNumber', { ascending: true })

    if (error) {
      console.error('getProblems error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('getProblems error:', error)
    throw error
  }
}

export const getProblem = async (pNumber: number): Promise<Problem> => {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .eq('pNumber', pNumber)
      .single()

    if (error) {
      console.error('getProblem error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('getProblem error:', error)
    throw error
  }
}

export const createProblem = async (
  problem: CreateProblemInput
): Promise<Problem> => {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('problems')
      .insert([problem])
      .single()

    if (error) {
      console.error('createProblem error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('createProblem error:', error)
    throw error
  }
}

export const deleteProblem = async (pNumber: number): Promise<Problem> => {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('problems')
      .delete()
      .eq('pNumber', pNumber)
      .single()

    if (error) {
      console.error('deleteProblem error:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('deleteProblem error:', error)
    throw error
  }
}
