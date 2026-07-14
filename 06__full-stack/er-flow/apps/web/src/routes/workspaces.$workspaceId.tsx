import { createFileRoute, Outlet, useParams, useLocation } from '@tanstack/react-router'
import { useState, useEffect, createContext, useContext } from 'react'
import { Sidebar } from '../features/documents/components/Sidebar.js'
import { UserMenu } from '../features/auth/components/UserMenu'

import { WorkspaceLayoutContext } from '../contexts/WorkspaceLayoutContext.js'

export const Route = createFileRoute('/workspaces/$workspaceId')({
  component: WorkspaceLayout,
})

function WorkspaceLayout() {
  const { workspaceId } = useParams({ from: '/workspaces/$workspaceId' })
  const location = useLocation()
  const isDocumentActive = location.pathname.includes('/documents/')

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isDocumentActive)

  // Collapse sidebar by default when opening a document, and open it when returning to dashboard index
  useEffect(() => {
    setIsSidebarCollapsed(isDocumentActive)
  }, [isDocumentActive])

  return (
    <WorkspaceLayoutContext.Provider value={{ isSidebarCollapsed, setIsSidebarCollapsed }}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased">
      {/* Explorer Sidebar - Collapsible with sliding micro-animations */}
      <div 
        className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-[#1b1b1e] ${
          isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        <Sidebar workspaceId={workspaceId} />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Workspace Top bar - Hide inside Document editor view */}
        {!isDocumentActive && (
          <header className="h-14 border-b border-white/5 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between select-none flex-shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Workspace:</span>
              <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  {workspaceId}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserMenu />
            </div>
          </header>
        )}

        {/* Content Outlet */}
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </div>
    </div>
    </WorkspaceLayoutContext.Provider>
  )
}
