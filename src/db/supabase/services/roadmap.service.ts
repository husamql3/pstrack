import { RoadmapRow } from '@/types/supabase.type'
import { createClient } from '@/db/supabase/server'

export const fetchRoadmap = async (): Promise<RoadmapRow[]> => {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from('roadmap').select('*')

    if (error) {
      console.error('fetchRoadmap error:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('catch fetchRoadmap error:', error)
    return []
  }
}
