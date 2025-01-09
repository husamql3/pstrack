export function getDifficultyColor(difficulty: 'Easy' | 'Medium' | 'Hard'): string {
  switch (difficulty) {
    case 'Easy':
      return '!bg-[#2cbb5d40] !text-[rgb(0,184,163)]' // Force styles with !
    case 'Medium':
      return '!bg-[#ffc01e40] !text-[rgb(255,192,30)]'
    case 'Hard':
      return '!bg-[#ef474340] !text-[rgb(255,55,95)]'
    default:
      return '!bg-gray-100 !text-gray-500'
  }
}
