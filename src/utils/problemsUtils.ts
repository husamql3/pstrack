import type { Difficulty, Topic } from '@/types/problems.type'

/**
 * Get the color for a given topic.
 * @param topic - The topic to get the color for.
 * @returns The color for the given topic.
 */
export const getTopicColor = (topic: Topic): string => {
  switch (topic) {
    case 'arrays-hashing':
      return 'bg-green-200 text-green-900'
    case 'two-pointers':
      return 'bg-yellow-200 text-yellow-900'
    case 'sliding-window':
      return 'bg-red-200 text-red-900'
    case 'stack':
      return 'bg-purple-200 text-purple-900'
    case 'binary-search':
      return 'bg-blue-200 text-blue-900'
    case 'linkedlist':
      return 'bg-orange-200 text-orange-900'
    case 'tree':
      return 'bg-emerald-200 text-emerald-900'
    case 'priority-queue':
      return 'bg-amber-200 text-amber-900'
    case 'backtracking':
      return 'bg-pink-200 text-pink-900'
    case 'tries':
      return 'bg-rose-200 text-rose-900'
    case 'graphs':
      return 'bg-indigo-200 text-indigo-900'
    case '1d-dp':
      return 'bg-teal-200 text-teal-900'
    case '2d-dp':
      return 'bg-cyan-200 text-cyan-900'
    default:
      return 'bg-gray-200 text-gray-900'
  }
}

/**
 * Get the color for a given difficulty.
 * @param difficulty - The difficulty to get the color for.
 * @returns The color for the given difficulty.
 */
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

/**
 * Get the text color for a given difficulty.
 * @param difficulty - The difficulty to get the text color for.
 * @returns The text color for the given difficulty.
 */
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

/**
 * Format a topic string.
 * @param topic - The topic to format.
 * @returns The formatted topic string.
 */
export const formatTopic = (topic: string): string => {
  return topic
    .trim()
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0) + word.slice(1))
    .join(' ')
}
