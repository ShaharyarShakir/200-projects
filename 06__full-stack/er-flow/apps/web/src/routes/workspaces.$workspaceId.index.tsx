import { createFileRoute, useNavigate, useParams, Link } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, Share2, Code, Sparkles, MoreHorizontal, Folder, FileText, ChevronDown, ArrowRight, User } from 'lucide-react'
import { useCreateDocument, useCreateFolder, useDocuments, useFolders } from '../features/documents/api/documents.js'

export const Route = createFileRoute('/workspaces/$workspaceId/')({
  component: WorkspaceIndex,
})

function WorkspaceIndex() {
  const { workspaceId } = useParams({ from: '/workspaces/$workspaceId/' })
  const navigate = useNavigate()

  const { data: documents = [], isLoading: docsLoading } = useDocuments(workspaceId)
  const { data: folders = [] } = useFolders(workspaceId)

  const createDocMutation = useCreateDocument()
  const createFolderMutation = useCreateFolder()

  const [activeTab, setActiveTab] = useState<'all' | 'recents' | 'created' | 'folders' | 'unsorted'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateDocument = () => {
    const title = "Untitled Document"
    createDocMutation.mutate(
      { title, workspaceId, folderId: null },
      {
        onSuccess: (newDoc) => {
          const docId = newDoc.id || newDoc._id
          navigate({ to: `/workspaces/${workspaceId}/documents/${docId}` })
        }
      }
    )
  }

  const handleCreateFolder = () => {
    const name = "Untitled Folder"
    createFolderMutation.mutate({ name, workspaceId })
  }

  // Filter documents based on active tab and search query
  const filteredDocs = documents.filter((doc) => {
    if (doc.isArchived) return false
    
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return doc.title.toLowerCase().includes(q)
    }

    // Tab filters
    if (activeTab === 'folders') return false // folders are handled separately or lists files inside folders
    if (activeTab === 'unsorted') return !doc.folderId
    return true
  })

  return (
    <div className="h-full flex flex-col bg-[#0f0f11] text-slate-100 font-sans select-none overflow-y-auto">
      {/* 1. Header controls section */}
      <div className="px-8 py-4 border-b border-[#1b1b1e] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f0f11]/60 backdrop-blur-md sticky top-0 z-20">
        {/* Tabs selector */}
        <div className="flex items-center gap-1 bg-[#131416] p-0.5 rounded-lg border border-white/5 text-xs text-slate-400">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'recents', label: 'Recents' },
              { id: 'created', label: 'Created by Me' },
              { id: 'folders', label: 'Folders' },
              { id: 'unsorted', label: 'Unsorted' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#222326] text-white border border-white/5'
                  : 'hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Invite controls */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative flex items-center bg-[#131416] border border-white/5 rounded-lg px-3 py-1.5 w-64 hover:border-slate-700/60 transition-colors">
            <Search className="h-3.5 w-3.5 text-slate-500 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs text-slate-350 w-full placeholder-slate-650"
            />
            <span className="text-[9px] font-extrabold text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-white/5 leading-none ml-2 select-none">
              /
            </span>
          </div>

          {/* Quick Search Shortcut badge */}
          <div className="bg-[#131416] border border-white/5 px-2 py-1.5 rounded-lg text-xs font-bold text-slate-400 cursor-pointer hover:text-white transition-colors">
            Ctrl K
          </div>

          <div className="h-4 w-[1px] bg-[#1b1b1e]" />

          {/* Invite block */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="bg-[#2f68fa] hover:bg-[#1d57e6] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[#2f68fa]/10 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Invite</span>
            </button>

            {/* Avatars Stack */}
            <div className="flex -space-x-1.5 overflow-hidden">
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0f0f11] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-md">S</div>
              <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[#0f0f11] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/5 shadow-md">U</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard workspace grid container */}
      <div className="max-w-6xl w-full mx-auto px-8 py-8 space-y-8 select-none">
        
        {/* Three Quick-Action Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Blank File */}
          <button
            type="button"
            onClick={handleCreateDocument}
            className="group relative bg-[#131416]/40 hover:bg-[#17181c]/60 border border-[#1d1e22] hover:border-slate-800/80 rounded-2xl p-6 h-36 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/20 group-hover:bg-indigo-600/5 transition-all text-slate-400 group-hover:text-indigo-400 shadow-md">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-3 block group-hover:text-white transition-colors">
              Create a Blank File
            </span>
          </button>

          {/* Card 2: AI Diagram */}
          <button
            type="button"
            onClick={handleCreateDocument}
            className="group relative bg-[#131416]/40 hover:bg-[#17181c]/60 border border-[#1d1e22] hover:border-slate-800/80 rounded-2xl p-6 h-36 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/20 group-hover:bg-indigo-600/5 transition-all text-slate-400 group-hover:text-indigo-400 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-3 block group-hover:text-white transition-colors">
              Generate an AI Diagram
            </span>
          </button>

          {/* Card 3: Eraser MCP */}
          <button
            type="button"
            className="group relative bg-[#131416]/40 hover:bg-[#17181c]/60 border border-[#1d1e22] hover:border-slate-800/80 rounded-2xl p-6 h-36 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-500/20 group-hover:bg-indigo-600/5 transition-all text-slate-400 group-hover:text-indigo-400 shadow-md">
              <Code className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 mt-3 block group-hover:text-white transition-colors">
              Connect Eraser MCP
            </span>
          </button>
        </div>

        {/* 3. Document Registry List Grid Table */}
        <div className="bg-[#131416]/20 border border-[#1b1b1e] rounded-2xl overflow-hidden shadow-xl">
          {/* Table Header columns */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#1b1b1e] text-[9px] font-extrabold uppercase text-slate-500 tracking-widest leading-none select-none">
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-1.5 col-start-8">Created</div>
            <div className="col-span-1.5">Edited</div>
            <div className="col-span-1 text-center">Comments</div>
            <div className="col-span-1 text-right">Author</div>
          </div>

          {/* Table Rows Body */}
          <div className="divide-y divide-[#1b1b1e]">
            {docsLoading ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Loading workspace documents registry...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
                No documents found matching the filter tags.
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const docId = doc.id || doc._id
                const folder = folders.find((f) => f.id === doc.folderId)
                return (
                  <div
                    key={docId}
                    onClick={() => navigate({ to: `/workspaces/${workspaceId}/documents/${docId}` })}
                    className="grid grid-cols-12 gap-4 px-6 py-3.5 hover:bg-[#131416]/40 cursor-pointer items-center transition-colors group text-xs text-slate-300 font-medium"
                  >
                    {/* Column: Name */}
                    <div className="col-span-5 flex items-center gap-3 overflow-hidden pr-2">
                      <FileText className="h-4 w-4 text-slate-500 flex-shrink-0 group-hover:text-indigo-400 transition-colors" />
                      <span className="truncate font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {doc.title}
                      </span>
                    </div>

                    {/* Column: Location */}
                    <div className="col-span-2 truncate text-slate-500">
                      {folder ? (
                        <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-[10px] text-slate-400">
                          {folder.name}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </div>

                    {/* Column: Created */}
                    <div className="col-span-1.5 col-start-8 text-slate-500 truncate">
                      3 months ago
                    </div>

                    {/* Column: Edited */}
                    <div className="col-span-1.5 text-slate-500 truncate">
                      3 months ago
                    </div>

                    {/* Column: Comments */}
                    <div className="col-span-1 text-center text-slate-500 font-semibold font-mono">
                      0
                    </div>

                    {/* Column: Author */}
                    <div className="col-span-1 flex items-center justify-end relative">
                      {/* Avatar badge */}
                      <div className="w-5.5 h-5.5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-extrabold text-white border border-white/10 group-hover:opacity-20 transition-opacity shadow-sm">
                        S
                      </div>
                      
                      {/* Hover Row Options Menu trigger */}
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded transition-all cursor-pointer text-slate-400 hover:text-white"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Floating help mark */}
      <button
        type="button"
        className="fixed bottom-6 right-6 w-9 h-9 bg-[#131416] hover:bg-[#1a1a1e] border border-white/5 hover:border-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold text-xs shadow-2xl transition-all cursor-pointer z-50"
      >
        ?
      </button>
    </div>
  )
}
