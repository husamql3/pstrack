import { roadmap } from '@prisma/client'

export const getRoadmap = async (): Promise<roadmap[]> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/roadmap`)

  if (!response.ok) {
    console.error('Failed to fetch roadmap data')
    return []
  }

  return await response.json()
}
