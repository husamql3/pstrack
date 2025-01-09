import { NeetCodeTopic } from '@/types/neetCodeTopic.type'

export function getTopicColor(topic: NeetCodeTopic): string {
  switch (topic) {
    case 'arrays-hashing':
      return 'bg-[#2cbb5d40] text-[rgb(0,184,163)]' // Light green background, teal text
    case 'two-pointers':
      return 'bg-[#ffc01e40] text-[rgb(255,192,30)]' // Light yellow background, gold text
    case 'sliding-window':
      return 'bg-[#ef474340] text-[rgb(255,55,95)]' // Light red background, pinkish-red text
    case 'stack':
      return 'bg-[#6f42c140] text-[rgb(111,66,193)]' // Light purple background, purple text
    case 'binary-search':
      return 'bg-[#17a2b840] text-[rgb(23,162,184)]' // Light cyan background, cyan text
    case 'linked-list':
      return 'bg-[#fd7e1440] text-[rgb(253,126,20)]' // Light orange background, orange text
    case 'trees':
      return 'bg-[#28a74540] text-[rgb(40,167,69)]' // Light green background, green text
    case 'tries':
      return 'bg-[#dc354540] text-[rgb(220,53,69)]' // Light red background, red text
    case 'heap-priority-queue':
      return 'bg-[#ffc10740] text-[rgb(255,193,7)]' // Light yellow background, yellow text
    case 'backtracking':
      return 'bg-[#007bff40] text-[rgb(0,123,255)]' // Light blue background, blue text
    case 'graphs':
      return 'bg-[#6610f240] text-[rgb(102,16,242)]' // Light indigo background, indigo text
    case 'advanced-graphs':
      return 'bg-[#e83e8c40] text-[rgb(232,62,140)]' // Light pink background, pink text
    case '1d-dynamic-programming':
      return 'bg-[#20c99740] text-[rgb(32,201,151)]' // Light teal background, teal text
    case '2d-dynamic-programming':
      return 'bg-[#17a2b840] text-[rgb(23,162,184)]' // Light cyan background, cyan text
    case 'greedy':
      return 'bg-[#ffc10740] text-[rgb(255,193,7)]' // Light yellow background, yellow text
    case 'intervals':
      return 'bg-[#6f42c140] text-[rgb(111,66,193)]' // Light purple background, purple text
    case 'math-geometry':
      return 'bg-[#17a2b840] text-[rgb(23,162,184)]' // Light cyan background, cyan text
    case 'bit-manipulation':
      return 'bg-[#6c757d40] text-[rgb(108,117,125)]' // Light gray background, gray text
    case 'javascript':
      return 'bg-[#f0db4f40] text-[rgb(240,219,79)]' // Light yellow background, yellow text
    case 'miscellaneous':
      return 'bg-[#6c757d40] text-[rgb(108,117,125)]' // Light gray background, gray text
    default:
      return 'bg-gray-100 text-gray-500' // Default fallback
  }
}
