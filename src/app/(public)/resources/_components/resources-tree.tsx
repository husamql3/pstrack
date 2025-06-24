'use client'

import { useState } from 'react'
import { SearchIcon } from 'lucide-react'

import type { GroupedResources } from '@/types/resources.type'

import { File, Files, Folder } from '@/ui/files'
import { Input } from '@/ui/input'
import { AddNewResourceBtn } from './add-new-resource-btn'

export const ResourcesTree = ({ resources }: { resources: GroupedResources }) => {
  const [searchTerm, setSearchTerm] = useState('')

  // Filter resources based on search term
  const filteredResources = resources
    .map((topicGroup) => {
      const filteredFolders = topicGroup.folders
        .map((folder) => {
          const filteredItems = folder.resources.filter(
            (item) =>
              item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.contributor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.type.toLowerCase().includes(searchTerm.toLowerCase())
          )
          return {
            ...folder,
            resources: filteredItems,
          }
        })
        .filter((folder) => folder.resources.length > 0) // Only show folders with matching resources

      return {
        ...topicGroup,
        folders: filteredFolders,
      }
    })
    .filter(
      (topicGroup) =>
        // Show topic if it matches search term OR has folders with matching resources
        topicGroup.topic.toLowerCase().includes(searchTerm.toLowerCase()) || topicGroup.folders.length > 0
    )

  return (
    <>
      <div className="relative">
        <Input
          className="peer ps-9"
          type="search"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
          }}
          placeholder="Quick search..."
        />
        <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
          <SearchIcon
            className="size-4"
            aria-hidden="true"
          />
        </div>
      </div>

      <Files className="w-full border-none bg-transparent">
        {filteredResources.length > 0 ? (
          filteredResources
            .sort((a, b) => a.topic.localeCompare(b.topic))
            .map((resource) => (
              <Folder
                key={resource.topic}
                name={resource.topic}
                className="cursor-pointer"
              >
                {resource.folders
                  .sort((a, b) => a.type.localeCompare(b.type))
                  .map((folder) => (
                    <Folder
                      key={folder.type}
                      name={folder.type}
                      className="cursor-pointer"
                    >
                      {folder.resources.map((item) => (
                        <File
                          key={item.id}
                          name={item.title}
                          href={item.url}
                          type={item.type}
                          contributor={item.contributor}
                        />
                      ))}
                    </Folder>
                  ))}
              </Folder>
            ))
        ) : (
          <div className="flex flex-col justify-center">
            <p className="h-full py-4 text-center">
              <p className="h-full py-4 text-center">
                Oops, looks like we didn&apos;t add resources for this topic yet.
                <br />
                Want to add one?
              </p>
            </p>
            <AddNewResourceBtn />
          </div>
        )}
      </Files>
    </>
  )
}
