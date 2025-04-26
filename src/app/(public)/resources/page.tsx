'use client'

import { File, Files, Folder } from '@/ui/files'

// https://animate-ui.com/docs/components/files

const RESOURCES = [
  {
    name: 'Trees',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Recursion',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Linked List',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Stack Queue',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Sliding Window',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Two Pointers',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Strings',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
  {
    name: 'Arrays Hashing',
    children: [
      { name: 'button.tsx' },
      { name: 'tabs.tsx' },
      { name: 'dialog.tsx' },
      { name: 'empty', isFolder: true },
    ],
  },
]

const Page = () => {
  return (
    <div className="mx-auto w-lg flex-1 py-10">
      <Files className="w-full max-w-[500px]">
        {RESOURCES.map((resource) => (
          <Folder
            key={resource.name}
            name={resource.name}
          >
            {resource.children.map((child) =>
              child.isFolder ? (
                <Folder
                  key={child.name}
                  name={child.name}
                />
              ) : (
                <File
                  key={child.name}
                  name={child.name}
                />
              )
            )}
          </Folder>
        ))}
      </Files>
    </div>
  )
}

export default Page
