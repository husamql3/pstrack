import { Difficulty } from '../../..'

/*
 * Get the color for the difficulty based on the difficulty level
 **/
export function getDifficultyColor(difficulty: Difficulty): string {
  switch (difficulty) {
    case 'easy':
      return 'bg-[#2cbb5d40] text-[rgb(0,184,163)]'
    case 'medium':
      return 'bg-[#ffc01e40] text-[rgb(255,192,30)]'
    case 'hard':
      return 'bg-[#ef474340] text-[rgb(255,55,95)]'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

export const getDifficultyTextColor = (difficulty: Difficulty): string => {
  switch (difficulty) {
    case 'easy':
      return 'text-[rgb(0,184,163)]'
    case 'medium':
      return 'text-[rgb(255,192,30)]'
    case 'hard':
      return 'text-[rgb(255,55,95)]'
    default:
      return 'text-gray-500'
  }
}
