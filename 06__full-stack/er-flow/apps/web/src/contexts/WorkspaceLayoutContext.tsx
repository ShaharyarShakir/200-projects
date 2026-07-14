import { createContext, useContext } from 'react'

export interface WorkspaceLayoutContextType {
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (v: boolean) => void
}

export const WorkspaceLayoutContext = createContext<WorkspaceLayoutContextType | null>(null)

export function useWorkspaceLayoutContext() {
  const context = useContext(WorkspaceLayoutContext)
  if (!context) {
    throw new Error('useWorkspaceLayoutContext must be used within a WorkspaceLayoutProvider')
  }
  return context
}
