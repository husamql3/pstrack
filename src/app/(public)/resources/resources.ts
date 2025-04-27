type FileResource = {
  name: string
  href?: string
}

type FolderResource = {
  name: string
  isFolder: true
  children: (FileResource | FolderResource)[]
}

type Resource = {
  name: string
  children: (FileResource | FolderResource)[]
}

export const RESOURCES: Resource[] = [
  {
    name: 'Trees',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Recursion',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Linked List',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Stack Queue',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Sliding Window',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Two Pointers',
    children: [{ name: 'button.tsx' }, { name: 'tabs.tsx' }, { name: 'dialog.tsx' }],
  },
  {
    name: 'Strings',
    children: [
      {
        name: 'String in Data Structure',
        href: 'https://www.tutorialspoint.com/data_structures_algorithms/string_data_structure.htm',
      },
      {
        name: 'Introduction to Strings',
        href: 'https://www.geeksforgeeks.org/introduction-to-strings-data-structure-and-algorithm-tutorials/',
      },
      {
        name: 'String cheatsheet for coding interviews',
        href: 'https://www.techinterviewhandbook.org/algorithms/string/',
      },
    ],
  },
  {
    name: 'Arrays & Hashing',
    children: [
      {
        name: 'Videos',
        isFolder: true,
        children: [
          {
            name: 'Hashing | MIT',
            href: 'https://www.youtube.com/watch?v=Nu8YGneFCWE',
          },
          {
            name: 'What is a HashTable Data Structure',
            href: 'https://www.youtube.com/watch?v=MfhjkfocRR0&t',
          },
          {
            name: 'Hashing Technique | Abdul Bari',
            href: 'https://www.youtube.com/watch?v=mFY0J5W8Udk',
          },
        ],
      },
      {
        name: 'Articles',
        isFolder: true,
        children: [
          {
            name: 'Array Data Structure',
            href: 'https://www.tutorialspoint.com/data_structures_algorithms/array_data_structure.htm',
          },
          {
            name: 'Getting Started with Array Data Structure',
            href: 'https://www.geeksforgeeks.org/introduction-to-arrays-data-structure-and-algorithm-tutorials/',
          },
          {
            name: 'Array cheatsheet for coding interviews',
            href: 'https://www.techinterviewhandbook.org/algorithms/array/',
          },
        ],
      },
    ],
  },
]
