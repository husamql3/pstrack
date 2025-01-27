import { roadmap } from '@prisma/client'

export const getRoadmap = async (): Promise<roadmap[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/roadmap`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching roadmap data:', error)
    return []
  }
}
