import type { Difficulty, Topic } from '@/types/problems.type'

/**
 * Get the color for a given topic.
 * @param topic - The topic to get the color for.
 * @returns The color for the given topic.
 */
export const getTopicColor = (topic: Topic) => {
  switch (topic) {
    case 'arrays-hashing':
      return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
    case 'two-pointers':
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400 border border-yellow-500/30'
    case 'sliding-window':
      return 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-400 border border-red-500/30'
    case 'stack':
      return 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400 border border-purple-500/30'
    case 'binary-search':
      return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 border border-blue-500/30'
    case 'linkedlist':
      return 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30'
    case 'tree':
      return 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30'
    case 'priority-queue':
      return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-yellow-500/30'
    case 'backtracking':
      return 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-400 border border-pink-500/30'
    case 'tries':
      return 'bg-gradient-to-r from-rose-500/20 to-pink-500/20 text-rose-400 border border-rose-500/30'
    case 'graphs':
      return 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-400 border border-indigo-500/30'
    case '1d-dp':
      return 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 border border-teal-500/30'
    case '2d-dp':
      return 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
    default:
      return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30'
  }
}
/**
 * Get the color for a given difficulty.
 * @param difficulty - The difficulty to get the color for.
 * @returns The color for the given difficulty.
 */
export const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30'
    case 'medium':
      return 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
    case 'hard':
      return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
    default:
      return 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-400 border border-gray-500/30'
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
