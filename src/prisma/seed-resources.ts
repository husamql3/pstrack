import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

// Resource tabs and types
const RESOURCE_TABS = [{ name: 'PROBLEM_SOLVING' }, { name: 'TECHNOLOGIES' }]

const RESOURCE_TYPES = [
  { name: 'article' },
  { name: 'video' },
  { name: 'youtube' },
  { name: 'frontendmasters' },
  { name: 'udemy' },
]

// Type mapping from data types to database enum values
const mapResourceType = (type: string): string => {
  switch (type?.toLowerCase()) {
    case 'youtube':
      return 'youtube'
    case 'article':
      return 'article'
    case 'video':
      return 'video'
    case 'frontendmasters':
      return 'frontendmasters'
    case 'udemy':
      return 'udemy'
    default:
      return 'article' // Default fallback
  }
}

// Complete Problem Solving Resources Data
const PROBLEM_SOLVING_RESOURCES = [
  // Trees
  {
    title: 'MIT | Binary tree P1',
    url: 'https://www.youtube.com/watch?v=76dhtgZt38A&pp=ygUIVHJlZSBNSVQ%3D',
    topic: 'Trees',
    type: 'youtube',
  },
  {
    title: 'MIT | Binary tree P2',
    url: 'https://www.youtube.com/watch?v=U1JYwHcFfso&t=1s&pp=ygUIVHJlZSBNSVQ%3D',
    topic: 'Trees',
    type: 'youtube',
  },
  {
    title: 'Abdul Bari | AVL Tree',
    url: 'https://www.youtube.com/watch?v=jDM6_TnYIqE&t=797s',
    topic: 'Trees',
    type: 'youtube',
  },
  {
    title: 'Abdul Bari | Trees and B+ Trees',
    url: 'https://www.youtube.com/watch?v=aZjYr87r1b8&t=2127s',
    topic: 'Trees',
    type: 'youtube',
  },
  {
    title: 'Tree cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/tree/',
    topic: 'Trees',
    type: 'article',
  },
  {
    title: 'Programiz | Trees',
    url: 'https://www.programiz.com/dsa/trees/',
    topic: 'Trees',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks | Introduction to Tree Data Structure',
    url: 'https://www.geeksforgeeks.org/introduction-to-tree-data-structure/',
    topic: 'Trees',
    type: 'article',
  },

  // Recursion
  {
    title: 'FreeCodeCamp | Recursion in Programming',
    url: 'https://www.youtube.com/watch?v=IJDJ0kBx2LM&t=42s&pp=ygUScmVjdXJzaW9uIHR1dG9yaWFs',
    topic: 'Recursion',
    type: 'youtube',
  },
  {
    title: 'Abdulkariim | Dynamic Programming',
    url: 'https://www.youtube.com/playlist?list=PLmaO6hgzMGBqH7QF0HQbfMM86Uh522R9N',
    topic: 'Recursion',
    type: 'youtube',
  },
  {
    title: 'Recursion (Basics to Advanced)',
    url: 'https://www.youtube.com/playlist?list=PLgUwDviBIf0rGlzIn_7rsaR2FQ5e6ZOL9',
    topic: 'Recursion',
    type: 'youtube',
  },
  {
    title: 'FreeCodeCamp | Recursion is not hard',
    url: 'https://www.freecodecamp.org/news/recursion-is-not-hard-858a48830d83/',
    topic: 'Recursion',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks | Introduction to Recursion',
    url: 'https://www.geeksforgeeks.org/introduction-to-recursion-2/',
    topic: 'Recursion',
    type: 'article',
  },
  {
    title: 'Recursion cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/recursion/',
    topic: 'Recursion',
    type: 'article',
  },

  // Sorting & Searching
  {
    title: 'Sorting and searching cheatsheet',
    url: 'https://www.techinterviewhandbook.org/algorithms/sorting-searching/',
    topic: 'Sorting & Searching',
    type: 'article',
  },
  {
    title: 'Programiz | Sorting Algorithms',
    url: 'https://www.programiz.com/dsa/sorting-algorithm',
    topic: 'Sorting & Searching',
    type: 'article',
  },
  {
    title: 'FreeCodeCamp | Sorting Algorithms',
    url: 'https://www.freecodecamp.org/news/sorting-algorithms-explained-with-examples-in-python-java-and-c/',
    topic: 'Sorting & Searching',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks | Searching Algorithms',
    url: 'https://www.geeksforgeeks.org/searching-algorithms/',
    topic: 'Sorting & Searching',
    type: 'article',
  },
  {
    title: 'Understanding The Different Types of Search Algorithms',
    url: 'https://www.luigisbox.com/blog/types-of-search-algorithms/',
    topic: 'Sorting & Searching',
    type: 'article',
  },
  {
    title: 'MIT | Searching and Sorting',
    url: 'https://www.youtube.com/watch?v=6LOwPhPDwVc&t=1s&pp=ygUVc2VhcmNoaW5nIHNvcnRpbmcgTUlU',
    topic: 'Sorting & Searching',
    type: 'youtube',
  },
  {
    title: 'Abdul Bari | Searching and Sorting (32:37)',
    url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O',
    topic: 'Sorting & Searching',
    type: 'youtube',
  },

  // Linked List
  {
    title: 'Linked lists in 4 minutes',
    url: 'https://www.youtube.com/watch?v=F8AbOfQwl1c',
    topic: 'Linked List',
    type: 'youtube',
  },
  {
    title: 'Introduction to Linked List',
    url: 'https://www.youtube.com/watch?v=R9PTBwOzceo',
    topic: 'Linked List',
    type: 'youtube',
  },
  {
    title: 'Programiz | Linked list Data Structure',
    url: 'https://www.programiz.com/dsa/linked-list',
    topic: 'Linked List',
    type: 'article',
  },
  {
    title: 'Tutorialspoint | Linked List Data Structure',
    url: 'https://www.tutorialspoint.com/data_structures_algorithms/linked_list_algorithms.htm',
    topic: 'Linked List',
    type: 'article',
  },
  {
    title: 'Linked list cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/linked-list/',
    topic: 'Linked List',
    type: 'article',
  },

  // Queue
  {
    title: 'Programiz | Queue Data Structure',
    url: 'https://www.programiz.com/dsa/queue',
    topic: 'Queue',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks | Queue Data Structure',
    url: 'https://www.geeksforgeeks.org/queue-data-structure/',
    topic: 'Queue',
    type: 'article',
  },
  {
    title: 'Tutorialspoint | Queue Data Structure',
    url: 'https://www.tutorialspoint.com/data_structures_algorithms/dsa_queue.htm',
    topic: 'Queue',
    type: 'article',
  },
  {
    title: 'Tech Interview Handbook | Queue cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/queue/',
    topic: 'Queue',
    type: 'article',
  },
  {
    title: 'Queue in 3 minutes',
    url: 'https://www.youtube.com/watch?v=D6gu-_tmEpQ',
    topic: 'Queue',
    type: 'youtube',
  },
  {
    title: 'Learn Queue data structures in 10 minutes',
    url: 'https://www.youtube.com/watch?v=nqXaPZi99JI',
    topic: 'Queue',
    type: 'youtube',
  },

  // Stack
  {
    title: 'Programiz | Stack Data Structure',
    url: 'https://www.programiz.com/dsa/stack',
    topic: 'Stack',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks | Stack Data Structure',
    url: 'https://www.geeksforgeeks.org/stack-data-structure/',
    topic: 'Stack',
    type: 'article',
  },
  {
    title: 'Tutorialspoint | Stack Data Structure',
    url: 'https://www.tutorialspoint.com/data_structures_algorithms/stack_algorithm.htm',
    topic: 'Stack',
    type: 'article',
  },
  {
    title: 'Tech Interview Handbook | Stack cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/stack/',
    topic: 'Stack',
    type: 'article',
  },
  {
    title: 'Introduction to Stacks',
    url: 'https://www.youtube.com/watch?v=I37kGX-nZEI&t=114s&pp=ygUFc3RhY2s%3D',
    topic: 'Stack',
    type: 'youtube',
  },
  {
    title: 'Stacks in 3 minutes',
    url: 'https://www.youtube.com/watch?v=KcT3aVgrrpU',
    topic: 'Stack',
    type: 'youtube',
  },
  {
    title: 'Learn Stack data structures in 10 minutes',
    url: 'https://www.youtube.com/watch?v=KInG04mAjO0',
    topic: 'Stack',
    type: 'youtube',
  },

  // Sliding Window
  {
    title: 'GeeksforGeeks | Sliding Window',
    url: 'https://www.geeksforgeeks.org/window-sliding-technique/',
    topic: 'Sliding Window',
    type: 'article',
  },
  {
    title: 'Neso Academy | Sliding Window',
    url: 'https://www.youtube.com/watch?v=LnbvhoxHn8M&t=246s',
    topic: 'Sliding Window',
    type: 'youtube',
  },
  {
    title: 'Sliding window technique',
    url: 'https://www.youtube.com/watch?v=p-ss2JNynmw&t=98s',
    topic: 'Sliding Window',
    type: 'youtube',
  },
  {
    title: 'Sliding window technique',
    url: 'https://www.youtube.com/watch?v=MK-NZ4hN7rs',
    topic: 'Sliding Window',
    type: 'youtube',
  },

  // Two Pointers
  {
    title: 'When should I use two pointer approach?',
    url: 'https://www.geeksforgeeks.org/when-should-i-use-two-pointer-approach',
    topic: 'Two Pointers',
    type: 'article',
  },
  {
    title: 'Two Pointers Technique',
    url: 'https://www.geeksforgeeks.org/two-pointers-technique/',
    topic: 'Two Pointers',
    type: 'article',
  },
  {
    title: 'Visual introduction Two Pointer Algorithm',
    url: 'https://www.youtube.com/watch?v=On03HWe2tZM',
    topic: 'Two Pointers',
    type: 'youtube',
  },
  {
    title: 'How to Use the Two Pointer Technique',
    url: 'https://www.youtube.com/watch?v=-gjxg6Pln50',
    topic: 'Two Pointers',
    type: 'youtube',
  },

  // Strings
  {
    title: 'String in Data Structure',
    url: 'https://www.tutorialspoint.com/data_structures_algorithms/string_data_structure.htm',
    topic: 'Strings',
    type: 'article',
  },
  {
    title: 'Introduction to Strings',
    url: 'https://www.geeksforgeeks.org/introduction-to-strings-data-structure-and-algorithm-tutorials/',
    topic: 'Strings',
    type: 'article',
  },
  {
    title: 'String cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/string/',
    topic: 'Strings',
    type: 'article',
  },

  // Hashing
  {
    title: 'MIT | Hashing',
    url: 'https://www.youtube.com/watch?v=Nu8YGneFCWE',
    topic: 'Hashing',
    type: 'youtube',
  },
  {
    title: 'CS50 | Hash Table',
    url: 'https://www.youtube.com/watch?v=btT4bCOvqjs',
    topic: 'Hashing',
    type: 'youtube',
  },
  {
    title: 'Abdul Bari | Hashing Technique',
    url: 'https://www.youtube.com/watch?v=mFY0J5W8Udk',
    topic: 'Hashing',
    type: 'youtube',
  },
  {
    title: 'What is a HashTable Data Structure',
    url: 'https://www.youtube.com/watch?v=MfhjkfocRR0&t',
    topic: 'Hashing',
    type: 'youtube',
  },

  // Arrays
  {
    title: 'Array Data Structure',
    url: 'https://www.tutorialspoint.com/data_structures_algorithms/array_data_structure.htm',
    topic: 'Arrays',
    type: 'article',
  },
  {
    title: 'Getting Started with Array Data Structure',
    url: 'https://www.geeksforgeeks.org/introduction-to-arrays-data-structure-and-algorithm-tutorials/',
    topic: 'Arrays',
    type: 'article',
  },
  {
    title: 'Array cheatsheet for coding interviews',
    url: 'https://www.techinterviewhandbook.org/algorithms/array/',
    topic: 'Arrays',
    type: 'article',
  },
]

// Complete Technologies Resources Data
const TECHNOLOGIES_RESOURCES = [
  // NodeJs
  {
    title: 'Node.js Tutorial',
    url: 'https://youtu.be/-MTSQjw5DrM?si=yhIxxMtHYKjxPnsb',
    topic: 'NodeJs',
    type: 'youtube',
  },
  {
    title: 'Node.js Tutorial for Beginners',
    url: 'https://youtube.com/playlist?list=PLC3y8-rFHvwh8shCMHFA5kWxD9PaPwxaY&si=Lw_0Cu5C9Huj9sNW',
    topic: 'NodeJs',
    type: 'youtube',
  },
  {
    title: 'Node.js, Express, MongoDB & More',
    url: 'https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/',
    topic: 'NodeJs',
    type: 'udemy',
  },
  {
    title: 'Node.js Internals and Architecture',
    url: 'https://www.udemy.com/course/nodejs-internals-and-architecture/?couponCode=KEEPLEARNING',
    topic: 'NodeJs',
    type: 'udemy',
  },
  {
    title: 'Introduction to Node.js, v3',
    url: 'https://frontendmasters.com/courses/node-js-v3/',
    topic: 'NodeJs',
    type: 'frontendmasters',
  },
  {
    title: 'API Design in Node.js, v4',
    url: 'https://frontendmasters.com/courses/api-design-nodejs-v4/',
    topic: 'NodeJs',
    type: 'frontendmasters',
  },

  // NextJs
  {
    title: 'Next.js Tutorial',
    url: 'https://www.youtube.com/watch?v=Sklc_fQBmcs',
    topic: 'NextJs',
    type: 'youtube',
  },
  {
    title: 'Next.js Full Course',
    url: 'https://www.youtube.com/watch?v=Zq5fmkH0T78',
    topic: 'NextJs',
    type: 'youtube',
  },
  {
    title: 'Next.js App Router Tutorial',
    url: 'https://youtu.be/k7o9R6eaSes?si=LqDnhs3epoDAMYQk',
    topic: 'NextJs',
    type: 'youtube',
  },
  {
    title: 'Next.js, v4',
    url: 'https://frontendmasters.com/courses/next-js-v4/',
    topic: 'NextJs',
    type: 'frontendmasters',
  },
  {
    title: 'Intermediate Next.js',
    url: 'https://frontendmasters.com/courses/intermediate-next-js/',
    topic: 'NextJs',
    type: 'frontendmasters',
  },
  {
    title: 'Next.js Dashboard App',
    url: 'https://nextjs.org/learn/dashboard-app/getting-started',
    topic: 'NextJs',
    type: 'article',
  },

  // ReactJs
  {
    title: 'React Tutorial for Beginners',
    url: 'https://youtu.be/TPACABQTHvM?si=8eHfoKPLkV4MI96Y',
    topic: 'ReactJs',
    type: 'youtube',
  },
  {
    title: 'React Tutorial Playlist',
    url: 'https://www.youtube.com/playlist?list=PLC3y8-rFHvwgg3vaYJgHGnModB54rxOk3',
    topic: 'ReactJs',
    type: 'youtube',
  },
  {
    title: 'Complete Intro to React, v9',
    url: 'https://frontendmasters.com/courses/complete-react-v9/',
    topic: 'ReactJs',
    type: 'frontendmasters',
  },
  {
    title: 'The Ultimate React Course',
    url: 'https://www.udemy.com/course/the-ultimate-react-course/',
    topic: 'ReactJs',
    type: 'udemy',
  },
  {
    title: 'React - The Complete Guide',
    url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/?couponCode=KEEPLEARNING',
    topic: 'ReactJs',
    type: 'udemy',
  },
  {
    title: 'Tao of React',
    url: 'https://alexkondov.com/tao-of-react/',
    topic: 'ReactJs',
    type: 'article',
  },
  {
    title: 'React Foundations',
    url: 'https://nextjs.org/learn/react-foundations/what-is-react-and-nextjs',
    topic: 'ReactJs',
    type: 'article',
  },

  // JavaScript
  {
    title: 'JavaScript Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk&pp=ygUTamF2YXNjcmlwdCB0dXRvcmlhbA%3D%3D',
    topic: 'JavaScript',
    type: 'youtube',
  },
  {
    title: 'JavaScript Tutorial Playlist',
    url: 'https://www.youtube.com/playlist?list=PLC3y8-rFHvwhI0V5mE9Vu6Nm-nap8EcjV',
    topic: 'JavaScript',
    type: 'youtube',
  },
  {
    title: 'JavaScript Course',
    url: 'https://www.youtube.com/watch?v=GM6dQBmc-Xg&list=PLDoPjvoNmBAx3kiplQR_oeDqLDBUDYwVv',
    topic: 'JavaScript',
    type: 'youtube',
  },
  {
    title: 'The Complete JavaScript Course',
    url: 'https://www.udemy.com/course/the-complete-javascript-course/',
    topic: 'JavaScript',
    type: 'udemy',
  },
  {
    title: 'Deep JavaScript Foundations, v3',
    url: 'https://frontendmasters.com/courses/deep-javascript-v3/',
    topic: 'JavaScript',
    type: 'frontendmasters',
  },
  {
    title: 'JavaScript: The Hard Parts, v2',
    url: 'https://frontendmasters.com/courses/javascript-hard-parts-v2/',
    topic: 'JavaScript',
    type: 'frontendmasters',
  },

  // TypeScript
  {
    title: 'TypeScript Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=d56mG7DezGs',
    topic: 'TypeScript',
    type: 'youtube',
  },
  {
    title: 'TypeScript Full Course',
    url: 'https://youtu.be/zQnBQ4tB3ZA?si=byskn3nX1p1Ksz5g',
    topic: 'TypeScript',
    type: 'youtube',
  },
  {
    title: 'TypeScript Crash Course',
    url: 'https://youtu.be/EcCTIExsqmI?si=06DjwCL0qYc2pAbj',
    topic: 'TypeScript',
    type: 'youtube',
  },
  {
    title: 'TypeScript Fundamentals, v4',
    url: 'https://frontendmasters.com/courses/typescript-v4/',
    topic: 'TypeScript',
    type: 'frontendmasters',
  },
  {
    title: 'Total TypeScript Tutorials',
    url: 'https://www.totaltypescript.com/tutorials',
    topic: 'TypeScript',
    type: 'article',
  },
  {
    title: 'TypeHero',
    url: 'https://typehero.dev/explore',
    topic: 'TypeScript',
    type: 'article',
  },

  // GraphQL
  {
    title: 'GraphQL Full Course',
    url: 'https://youtu.be/eIQh02xuVw4?si=WF7LoeBEQeqNfY9h',
    topic: 'GraphQL',
    type: 'youtube',
  },
  {
    title: 'GraphQL Crash Course',
    url: 'https://youtu.be/ZQL7tL2S0oQ?si=1A5v1rO4BckiYZqp',
    topic: 'GraphQL',
    type: 'youtube',
  },
  {
    title: 'GraphQL Tutorial',
    url: 'https://youtu.be/5199E50O7SI?si=fIE_2XJOkVIN0_Zc',
    topic: 'GraphQL',
    type: 'youtube',
  },
  {
    title: 'Advanced GraphQL, v2',
    url: 'https://frontendmasters.com/courses/advanced-graphql-v2/',
    topic: 'GraphQL',
    type: 'frontendmasters',
  },
  {
    title: 'Client-Side GraphQL in React',
    url: 'https://frontendmasters.com/courses/client-graphql-react-v2/',
    topic: 'GraphQL',
    type: 'frontendmasters',
  },
  {
    title: 'GraphQL Tutorial',
    url: 'https://www.educative.io/blog/graphql-tutorial',
    topic: 'GraphQL',
    type: 'article',
  },
  {
    title: 'TutorialsPoint GraphQL',
    url: 'https://www.tutorialspoint.com/graphql/index.htm',
    topic: 'GraphQL',
    type: 'article',
  },
  {
    title: 'GeeksforGeeks GraphQL Tutorial',
    url: 'https://www.geeksforgeeks.org/graphql-tutorial/',
    topic: 'GraphQL',
    type: 'article',
  },

  // Docker
  {
    title: 'Docker Tutorial for Beginners',
    url: 'https://youtu.be/rIrNIzy6U_g?si=20N-TldYScp9seGo',
    topic: 'Docker',
    type: 'youtube',
  },
  {
    title: 'Docker Crash Course',
    url: 'https://youtu.be/GFgJkfScVNU?si=jnqqpvlpL4uX-byC',
    topic: 'Docker',
    type: 'youtube',
  },
  {
    title: 'Docker Tutorial',
    url: 'https://youtu.be/pTFZFxd4hOI?si=0OKWqf2X5_ygAOqO',
    topic: 'Docker',
    type: 'youtube',
  },
  {
    title: 'Docker Full Course',
    url: 'https://youtu.be/eGz9DS-aIeY?si=CP6nYYbppNKTlzVJ',
    topic: 'Docker',
    type: 'youtube',
  },

  // C
  {
    title: 'C Programming Tutorials',
    url: 'https://www.youtube.com/playlist?list=PLA1FTfKBAEX4hblYoH6mnq0zsie2w6Wif',
    topic: 'C',
    type: 'youtube',
  },

  // C++
  {
    title: 'Mosh | C++ Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=ZzaPdXTrSb8&pp=ygUMQysrIFR1dG9yaWFs',
    topic: 'C++',
    type: 'youtube',
  },
  {
    title: 'C++ Full Course',
    url: 'https://www.youtube.com/watch?v=-TkoO8Z07hI&pp=ygUMQysrIFR1dG9yaWFs',
    topic: 'C++',
    type: 'youtube',
  },
  {
    title: 'FreeCodeCamp | C++ Tutorial for Beginners',
    url: 'https://www.youtube.com/watch?v=vLnPwxZdW4Y&pp=ygUMQysrIFR1dG9yaWFs',
    topic: 'C++',
    type: 'youtube',
  },

  // DB
  {
    title: 'AMR Elhelw | Relational Database Internals (English)',
    url: 'https://www.youtube.com/playlist?list=PLE8kQVoC67PywFpq0VXxGFbStvtskNVkW',
    topic: 'DB',
    type: 'youtube',
  },
  {
    title: 'AMR Elhelw | Relational Database Internals (Arabic)',
    url: 'https://www.youtube.com/playlist?list=PLE8kQVoC67PzGwMMsSk3C8MvfAqcYjusF',
    topic: 'DB',
    type: 'youtube',
  },
  {
    title: '(Not a tutorial) but a good overview',
    url: 'https://www.youtube.com/watch?v=3gVBjTMS8FE&t=618s&pp=ygUJZGF0YSBiYXNl',
    topic: 'DB',
    type: 'youtube',
  },

  // Git & GitHub
  {
    title: 'Elzero | Learn Git and Github',
    url: 'https://www.youtube.com/playlist?list=PLDoPjvoNmBAw4eOj58MZPakHjaO3frVMF',
    topic: 'Git & GitHub',
    type: 'youtube',
  },
  {
    title: 'Ghareeb | Github in one hour',
    url: 'https://www.youtube.com/watch?v=fDkR0TDR9dI&t=2226s&pp=ygUPZ2l0aHViIHR1dG9yaWFs',
    topic: 'Git & GitHub',
    type: 'youtube',
  },
  {
    title: 'Big Data | Github in depth',
    url: 'https://www.youtube.com/watch?v=Q6G-J54vgKc&t=9965s&pp=ygUPZ2l0aHViINi02K3YqNi3',
    topic: 'Git & GitHub',
    type: 'youtube',
  },
]

async function main() {
  console.log('🌱 Starting comprehensive resources seeding with ALL data...')

  try {
    await db.$connect()

    // Clear existing data (in correct order due to foreign key constraints)
    console.log('🗑️ Dropping existing resources table and related data...')
    await db.resources.deleteMany()
    await db.resource_types.deleteMany()
    await db.resource_tabs.deleteMany()

    // Seed resource tabs
    console.log('📋 Seeding resource tabs...')
    const createdTabs = await Promise.all(
      RESOURCE_TABS.map(async (tab) => {
        return await db.resource_tabs.create({
          data: tab,
        })
      })
    )
    console.log(`✅ Created ${createdTabs.length} resource tabs`)

    // Seed resource types
    console.log('🏷️ Seeding resource types...')
    const createdTypes = await Promise.all(
      RESOURCE_TYPES.map(async (type) => {
        return await db.resource_types.create({
          data: type,
        })
      })
    )
    console.log(`✅ Created ${createdTypes.length} resource types`)

    // Create lookup maps for IDs
    const tabMap = new Map(createdTabs.map((tab) => [tab.name, tab.id]))
    const typeMap = new Map(createdTypes.map((type) => [type.name, type.id]))

    // Prepare all resources data
    const allResourcesData = [
      ...PROBLEM_SOLVING_RESOURCES.map((resource) => ({
        ...resource,
        tab_name: 'PROBLEM_SOLVING',
        contributor: '@husamql3',
        is_visible: true,
        is_approved: true,
      })),
      ...TECHNOLOGIES_RESOURCES.map((resource) => ({
        ...resource,
        tab_name: 'TECHNOLOGIES',
        contributor: '@husamql3',
        is_visible: true,
        is_approved: true,
      })),
    ]

    // Seed resources
    console.log(`📚 Seeding ${allResourcesData.length} resources...`)
    let successCount = 0
    let failureCount = 0

    for (const resource of allResourcesData) {
      try {
        const mappedType = mapResourceType(resource.type)
        const typeId = typeMap.get(mappedType)
        const tabId = tabMap.get(resource.tab_name)

        if (!typeId || !tabId) {
          console.error(`❌ Missing type or tab ID for resource: ${resource.title}`)
          console.error(`   Type: ${resource.type} -> ${mappedType} (ID: ${typeId})`)
          console.error(`   Tab: ${resource.tab_name} (ID: ${tabId})`)
          failureCount++
          continue
        }

        await db.resources.create({
          data: {
            title: resource.title,
            url: resource.url,
            contributor: resource.contributor,
            topic: resource.topic,
            type_id: typeId,
            tab_id: tabId,
            is_visible: resource.is_visible,
            is_approved: resource.is_approved,
          },
        })
        successCount++

        if (successCount % 20 === 0) {
          console.log(`   ✅ Completed ${successCount}/${allResourcesData.length} resources`)
        }
      } catch (error) {
        console.error(`❌ Failed to insert resource: ${resource.title}`, error)
        failureCount++
      }
    }

    console.log('✨ Resources seeding completed!')

    // Display summary
    const totalResources = await db.resources.count()
    const totalTabs = await db.resource_tabs.count()
    const totalTypes = await db.resource_types.count()

    const problemSolvingCount = await db.resources.count({
      where: {
        tab: {
          name: 'PROBLEM_SOLVING',
        },
      },
    })

    const technologiesCount = await db.resources.count({
      where: {
        tab: {
          name: 'TECHNOLOGIES',
        },
      },
    })

    console.log(`📊 Comprehensive Seeding Summary:`)
    console.log(`   Resource tabs: ${totalTabs}`)
    console.log(`   Resource types: ${totalTypes}`)
    console.log(`   Total resources: ${totalResources}`)
    console.log(`   Problem Solving: ${problemSolvingCount}`)
    console.log(`   Technologies: ${technologiesCount}`)
    console.log(`   Success: ${successCount}, Failures: ${failureCount}`)

    // Show breakdown by topic
    console.log(`\n📈 Breakdown by topic:`)
    const topicCounts = await db.resources.groupBy({
      by: ['topic'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    topicCounts.forEach(({ topic, _count }) => {
      console.log(`   ${topic}: ${_count.id} resources`)
    })
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .then(async () => {
    await db.$disconnect()
    console.log('🔌 Database connection closed')
  })
  .catch(async (error) => {
    console.error('💥 Seeding failed:', error)
    await db.$disconnect()
    process.exit(1)
  })
