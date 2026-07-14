import { createFileRoute, useParams, Link } from '@tanstack/react-router'
import { useWorkspaceLayoutContext } from '../contexts/WorkspaceLayoutContext.js'
import React, { useEffect, useState } from 'react'
import {
  useDocument,
  useUpdateDocument,
  useSnapshots,
  useCreateSnapshot,
  useRestoreSnapshot,
  useFolders
} from '../features/documents/api/documents.js'
import { CollaborationProvider, useCollaboration } from '@eraser/collaboration'
import {
  useCanvas,
  SvgRenderer,
  getSelectionBounds,
  fitToRect,
  zoomToPoint,
  screenToWorld,
  isPointInRect,
  isPointInCircle,
  isPointInDiamond,
  isPointNearLine
} from '@eraser/canvas'
import { CollaborativeEditor } from '@eraser/editor'
import { useSession } from '../features/auth/hooks/use-session'
import { validateSchema, generateSql, ER_TEMPLATES } from '@eraser/er'
import {
  History,
  MousePointer,
  Square,
  Circle as CircleIcon,
  Diamond,
  ArrowRight,
  Minus,
  Type,
  FileText,
  Trash2,
  Info,
  Layers,
  Sparkles,
  BookOpen,
  MessageSquare,
  Database,
  Link2 as LinkIcon,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Share2,
  Menu
} from 'lucide-react'

export const Route = createFileRoute('/workspaces/$workspaceId/documents/$documentId')({
  component: DocumentDashboardLoader,
})

// Helper to get Better Auth session token from cookies
function getSessionToken() {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/better-auth\.session_token=([^;]+)/)
  return match ? match[1] : undefined
}

function DocumentDashboardLoader() {
  const { workspaceId, documentId } = useParams({
    from: '/workspaces/$workspaceId/documents/$documentId'
  })

  const { data: doc, isLoading } = useDocument(documentId)
  const token = getSessionToken()
  const collaborationUrl =
    import.meta.env.VITE_COLLABORATION_URL || 'ws://localhost:1234'

  if (isLoading || !doc) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <CollaborationProvider
      url={collaborationUrl}
      documentName={`workspace_${workspaceId}/document_${documentId}`}
      token={token}
    >
      <DocumentDashboard doc={doc} workspaceId={workspaceId} documentId={documentId} />
    </CollaborationProvider>
  )
}

interface DocumentDashboardProps {
  doc: any
  workspaceId: string
  documentId: string
}

function DocumentDashboard({ doc, workspaceId, documentId }: DocumentDashboardProps) {
  const { status, doc: ydoc, provider } = useCollaboration()
  const { data: session } = useSession()
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useWorkspaceLayoutContext()
  const updateDocMutation = useUpdateDocument()
  const { data: snapshots = [], refetch: refetchSnapshots } = useSnapshots(documentId)
  const createSnapshotMutation = useCreateSnapshot()
  const restoreSnapshotMutation = useRestoreSnapshot()
  const { data: folders = [] } = useFolders(workspaceId)

  const [title, setTitle] = useState(doc.title)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'shapes' | 'components' | 'favorites' | 'sql' | 'validation'>('explorer')
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(true)
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false)
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false)
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false)

  // Layout Modes: 'document' (text only) | 'canvas' (whiteboard only) | 'split' (side-by-side)
  const [layoutMode, setLayoutMode] = useState<'document' | 'canvas' | 'split'>('split')

  // Track cursor position in World coordinates
  const [mouseWorldPos, setMouseWorldPos] = useState({ x: 0, y: 0 })

  // SQL & Validation States
  const [activeSqlDialect, setActiveSqlDialect] = useState<'postgres' | 'mysql' | 'sqlite' | 'sqlserver'>('postgres')
  const [copiedSql, setCopiedSql] = useState(false)

  // Initialize Canvas Engine
  const engine = useCanvas(ydoc)

  // Extract entities & relationships for SQL DDL compilation and validation checks
  const shapes = engine?.getShapes() || []

  const erEntities = shapes
    .filter((s) => s.type === "er-entity")
    .map((s) => ({
      id: s.id,
      name: s.text || "Untitled",
      attributes: (s as any).attributes || [],
    }))

  const erRelationships = shapes
    .filter((s) => s.type === "er-relationship")
    .map((s) => ({
      id: s.id,
      sourceEntityId: (s as any).sourceEntityId,
      targetEntityId: (s as any).targetEntityId,
      sourceCardinality: (s as any).sourceCardinality || "1",
      targetCardinality: (s as any).targetCardinality || "*",
      identifying: (s as any).identifying ?? true,
      label: (s as any).label || "",
    }))

  const generatedSql = generateSql(erEntities, erRelationships, activeSqlDialect)
  const schemaErrors = validateSchema(erEntities, erRelationships)

  const handleLoadTemplate = (templateKey: string) => {
    if (!engine) return
    const template = ER_TEMPLATES[templateKey]
    if (!template) return

    if (!confirm(`Load the "${template.name}" template? This will clear all existing whiteboard contents.`)) return

    engine.transact(() => {
      const currentShapes = engine.getShapes()
      for (const s of currentShapes) {
        engine.deleteShape(s.id)
      }

      // Add entities in spaced grid layout
      const spacingX = 240
      const spacingY = 220
      template.entities.forEach((entity, idx) => {
        const col = idx % 2
        const row = Math.floor(idx / 2)
        engine.addShape({
          id: entity.id,
          type: "er-entity",
          x: 100 + col * spacingX,
          y: 100 + row * spacingY,
          width: 170,
          height: 150,
          rotation: 0,
          fill: "#0f172a",
          stroke: "#1e293b",
          strokeWidth: 2,
          opacity: 1,
          text: entity.name,
          attributes: entity.attributes,
        } as any)
      })

      // Add relationships
      template.relationships.forEach((rel) => {
        engine.addShape({
          id: rel.id,
          type: "er-relationship",
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          rotation: 0,
          fill: "transparent",
          stroke: "#818cf8",
          strokeWidth: 2,
          opacity: 1,
          sourceEntityId: rel.sourceEntityId,
          targetEntityId: rel.targetEntityId,
          sourceCardinality: rel.sourceCardinality,
          targetCardinality: rel.targetCardinality,
          identifying: rel.identifying,
          label: rel.label,
          points: [],
        } as any)
      })

      engine.syncRelationshipPoints()
    })
  }

  // Sync title from backend query
  useEffect(() => {
    setTitle(doc.title)
  }, [doc.title])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== doc.title) {
      updateDocMutation.mutate({
        id: documentId,
        data: { title: title.trim() },
      })
    }
  }

  const handleCreateSnapshot = () => {
    createSnapshotMutation.mutate(documentId, {
      onSuccess: () => {
        alert('Snapshot created successfully!')
        refetchSnapshots()
      },
      onError: () => {
        alert('Failed to create snapshot. Ensure collaborative edits exist first.')
      }
    })
  }

  const handleRestoreSnapshot = (snapshotId: string) => {
    if (!confirm('Are you sure you want to restore this document to this snapshot? Current unsaved edits will be overwritten.')) return
    restoreSnapshotMutation.mutate({ documentId, snapshotId })
  }

  // Double-click to edit text inside a shape
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!engine) return
    const container = e.currentTarget.querySelector('svg')
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pt = screenToWorld(e.clientX, e.clientY, engine.camera, rect)

    const shapes = engine.getShapes()
    let clickedShape: any = null
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i]
      let isHit = false
      switch (shape.type) {
        case "rectangle":
        case "text":
        case "sticky":
        case "image":
        case "er-entity":
          isHit = isPointInRect(pt, shape)
          break
        case "circle":
          isHit = isPointInCircle(pt, shape)
          break
        case "diamond":
          isHit = isPointInDiamond(pt, shape)
          break
        case "arrow":
        case "line":
          isHit = isPointNearLine(pt, shape.points || [], 8)
          break
      }
      if (isHit) {
        clickedShape = shape
        break
      }
    }

    if (clickedShape) {
      setEditingShapeId(clickedShape.id)
    }
  }

  // Handle Zoom Wheel
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!engine) return
    e.preventDefault()
    const container = e.currentTarget.querySelector('svg')
    if (!container) return
    const rect = container.getBoundingClientRect()

    // Zoom factor based on wheel direction
    const factor = e.deltaY < 0 ? 1.15 : 0.85
    const nextCamera = zoomToPoint(factor, e.clientX, e.clientY, engine.camera, rect)
    engine.updateCamera(nextCamera)
  }

  // Track cursor location on SVG container move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!engine) return
    const container = e.currentTarget.querySelector('svg')
    if (!container) return
    const rect = container.getBoundingClientRect()
    const pt = screenToWorld(e.clientX, e.clientY, engine.camera, rect)
    setMouseWorldPos(pt)
  }

  // Zoom fit to bounds of all shapes
  const handleFitToScreen = () => {
    if (!engine) return
    const container = document.querySelector('.canvas-viewport')
    if (!container) return
    const rect = container.getBoundingClientRect()

    const shapes = engine.getShapes()
    if (shapes.length === 0) {
      engine.updateCamera({ x: 0, y: 0, zoom: 1 })
      return
    }

    const bounds = getSelectionBounds(shapes)
    if (bounds) {
      const nextCamera = fitToRect(bounds, rect.width, rect.height, 60)
      engine.updateCamera(nextCamera)
    }
  }

  const documentFolder = folders.find(f => f.id === doc.folderId)

  // Selection & active properties calculation
  const selectedShapes = engine?.getSelectedShapes() || []
  const hasSelection = selectedShapes.length > 0

  // Get common properties for the properties inspector
  const activeProperties = {
    fill: selectedShapes.length === 1 ? selectedShapes[0].fill : '',
    stroke: selectedShapes.length === 1 ? selectedShapes[0].stroke : '',
    strokeWidth: selectedShapes.length === 1 ? selectedShapes[0].strokeWidth : 2,
    opacity: selectedShapes.length === 1 ? selectedShapes[0].opacity : 1,
    rotation: selectedShapes.length === 1 ? selectedShapes[0].rotation : 0,
    text: selectedShapes.length === 1 ? selectedShapes[0].text || '' : '',
    width: selectedShapes.length === 1 ? Math.round(selectedShapes[0].width) : 0,
    height: selectedShapes.length === 1 ? Math.round(selectedShapes[0].height) : 0,
    x: selectedShapes.length === 1 ? Math.round(selectedShapes[0].x) : 0,
    y: selectedShapes.length === 1 ? Math.round(selectedShapes[0].y) : 0,
  }

  const updateSelectedProperty = (key: string, value: any) => {
    if (!engine) return
    engine.transact(() => {
      for (const s of selectedShapes) {
        engine.updateShape(s.id, { [key]: value })
      }
    })
  }

  const currentUserData = session?.user ? {
    name: session.user.name,
    avatar: session.user.image || undefined,
  } : undefined;

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Main Navigation / Breadcrumbs Header */}
      <header className="px-6 py-2.5 border-b border-[#1b1b1e] bg-[#0f0f11] flex flex-row items-center justify-between gap-4 select-none flex-shrink-0">
        {/* Left Side: Logo & Document Title */}
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {/* Toggle Explorer Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 hover:bg-[#222326] rounded text-slate-400 hover:text-white cursor-pointer transition-colors flex-shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link
            to="/workspaces/$workspaceId"
            params={{ workspaceId }}
            title="Go to dashboard"
            className="flex items-center gap-2 flex-shrink-0 group"
          >
            {/* Colored slanted parallel pills logo */}
            <div className="flex flex-col justify-between w-4 h-4 transform -rotate-12 flex-shrink-0">
              <div className="h-1.2 w-3.5 bg-red-500 rounded-full" />
              <div className="h-1.2 w-3.5 bg-sky-500 rounded-full translate-x-1" />
            </div>
          </Link>

          <div className="h-4 w-[1px] bg-[#1b1b1e] flex-shrink-0" />

          <div className="flex items-center gap-1.5 overflow-hidden">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="text-xs font-bold bg-transparent border border-transparent hover:border-slate-800 focus:border-indigo-500 focus:bg-slate-900 rounded px-1.5 py-0.5 outline-none text-slate-200 w-32 md:w-48 truncate transition-colors"
            />
            <ChevronDown className="h-3 w-3 text-slate-500 flex-shrink-0 cursor-pointer" />
          </div>
        </div>

        {/* Center Side: Segmented layout controls */}
        <div className="flex items-center bg-[#131416] border border-white/5 rounded-lg p-0.5 text-xs text-slate-400">
          {(
            [
              { id: 'document', label: 'Document' },
              { id: 'split', label: 'Both' },
              { id: 'canvas', label: 'Canvas' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setLayoutMode(tab.id)}
              className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer text-[11px] ${(tab.id === 'split' ? layoutMode === 'split' : layoutMode === tab.id)
                ? 'bg-[#222326] text-white border border-white/5'
                : 'hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Side: Toolbar controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Shortcut badge */}
          <div className="hidden md:block bg-[#131416] border border-white/5 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 cursor-pointer select-none">
            Ctrl K
          </div>

          {/* Sync Status Icon indicator */}
          <div className="flex items-center pr-1">
            {status === 'connected' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" title="Synchronized with Cloud" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Connecting..." />
            )}
          </div>

          {/* Share / Link Copy trigger */}
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert("Workspace document link copied to clipboard!")
            }}
            className="bg-[#131416] border border-white/5 hover:border-slate-800 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5 text-slate-400" />
            <span>Share</span>
          </button>

          {/* AI Chat Blue button */}
          <button
            type="button"
            className="bg-[#2f68fa] hover:bg-[#1d57e6] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-[#2f68fa]/10 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Chat</span>
          </button>

          {/* Messages / Comments panel trigger */}
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={`p-1.5 border rounded-lg transition-all cursor-pointer ${showComments
              ? 'bg-indigo-650 border-indigo-500 text-white shadow-inner'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            title="Toggle Comments"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>

          {/* Snapshot History list toggle */}
          <button
            type="button"
            onClick={() => setShowSnapshots(!showSnapshots)}
            className={`p-1.5 border rounded-lg transition-all cursor-pointer ${showSnapshots
              ? 'bg-indigo-650 border-indigo-500 text-white shadow-inner'
              : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200'
              }`}
            title="Revision History"
          >
            <History className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>



      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar drawer toggle handle */}
        {layoutMode !== 'document' && (
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 z-40 bg-[#131416]/95 hover:bg-[#1a1a1e] border border-white/5 hover:border-slate-800 text-slate-400 hover:text-white w-4.5 h-10 rounded-r-lg flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300"
            style={{ left: isLeftPanelCollapsed ? '0px' : '256px' }}
            title={isLeftPanelCollapsed ? "Expand validation panel" : "Collapse validation panel"}
          >
            {isLeftPanelCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Left Canvas Sidebar (Render only when whiteboard layout is active) */}
        {layoutMode !== 'document' && (
          <aside 
            className={`border-r border-[#1b1b1e] bg-[#0c0c0e]/80 flex flex-col transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
              isLeftPanelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
            }`}
          >
            {/* Tabs header */}
            <div className="flex border-b border-slate-800 p-1 text-[10px] font-semibold bg-slate-950/20">
              {(
                [
                  { id: 'explorer', label: 'Files', icon: Layers },
                  { id: 'shapes', label: 'Shapes', icon: Sparkles },
                  { id: 'sql', label: 'SQL', icon: Database },
                  { id: 'validation', label: 'Check', icon: AlertCircle },
                ]
              ).map((tab) => {
                const Icon = tab.icon
                const isActive = activeSidebarTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSidebarTab(tab.id as any)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded transition-all cursor-pointer ${isActive
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab contents */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeSidebarTab === 'explorer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                      Document Canvas Layers
                    </span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                      {engine?.getShapes().length || 0} items
                    </span>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {engine?.getShapes().length === 0 ? (
                      <div className="text-slate-600 italic text-center py-6">
                        No shapes added yet.
                      </div>
                    ) : (
                      engine?.getShapes().map((shape) => {
                        const isSelected = engine.selectedIds.has(shape.id)
                        return (
                          <div
                            key={shape.id}
                            onClick={() => {
                              engine.selectShape(shape.id, false)
                              engine.updateCamera({
                                x: 200 - (shape.x + shape.width / 2) * engine.camera.zoom,
                                y: 200 - (shape.y + shape.height / 2) * engine.camera.zoom,
                              })
                            }}
                            className={`flex items-center justify-between p-2 rounded transition-colors group cursor-pointer ${isSelected
                              ? 'bg-indigo-950/40 border border-indigo-800/40 text-indigo-200'
                              : 'hover:bg-slate-800/60 text-slate-300'
                              }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: shape.stroke }} />
                              <span className="capitalize font-medium truncate">
                                {shape.type}: {shape.text || `<No Text>`}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                engine.deleteShape(shape.id)
                              }}
                              className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              {activeSidebarTab === 'shapes' && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                    Quick Click Insert
                  </span>
                  <p className="text-slate-500 text-[10px] leading-relaxed">
                    Select a tool from the top toolbar, then click and drag on the canvas to draw.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {(
                      [
                        { id: 'rectangle', name: 'Rectangle', icon: Square },
                        { id: 'circle', name: 'Circle', icon: CircleIcon },
                        { id: 'diamond', name: 'Diamond', icon: Diamond },
                        { id: 'sticky', name: 'Sticky Note', icon: FileText },
                      ]
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (!engine) return
                          const newId = crypto.randomUUID()
                          engine.addShape({
                            id: newId,
                            type: item.id as any,
                            x: 100 - engine.camera.x,
                            y: 100 - engine.camera.y,
                            width: 120,
                            height: item.id === 'sticky' ? 120 : 80,
                            rotation: 0,
                            fill: item.id === 'sticky' ? '#fef08a' : 'transparent',
                            stroke: '#6366f1',
                            strokeWidth: 2,
                            opacity: 1,
                            text: item.id === 'sticky' ? 'Double Click' : '',
                          })
                          engine.selectShape(newId, false)
                        }}
                        className="flex flex-col items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:bg-slate-850 transition-all text-slate-300 cursor-pointer"
                      >
                        <item.icon className="h-5 w-5 text-indigo-400" />
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSidebarTab === 'sql' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                      Target Dialect
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['postgres', 'mysql', 'sqlite', 'sqlserver'] as const).map((dial) => (
                        <button
                          key={dial}
                          type="button"
                          onClick={() => setActiveSqlDialect(dial)}
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold uppercase transition-all cursor-pointer ${activeSqlDialect === dial
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                        >
                          {dial === 'sqlserver' ? 'SQL Server' : dial}
                        </button>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-800" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                        Generated DDL
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedSql)
                          setCopiedSql(true)
                          setTimeout(() => setCopiedSql(false), 2000)
                        }}
                        className="bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white px-2.5 py-1 rounded text-[10px] font-bold text-slate-300 cursor-pointer transition-all"
                      >
                        {copiedSql ? '✓ Copied!' : 'Copy Schema'}
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={generatedSql}
                      className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-2.5 outline-none font-mono text-[9px] text-indigo-250 custom-scrollbar resize-none leading-relaxed select-all"
                    />
                  </div>

                  <hr className="border-slate-800" />

                  {/* Load Starter Templates */}
                  <div className="space-y-2.5">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                      Starter Templates
                    </span>
                    <div className="space-y-1.5">
                      {Object.keys(ER_TEMPLATES).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleLoadTemplate(key)}
                          className="w-full flex items-center justify-between p-2 bg-slate-900/40 hover:bg-indigo-500/10 border border-slate-800 hover:border-indigo-500/30 rounded-xl text-left cursor-pointer transition-all duration-200"
                        >
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block">
                              {ER_TEMPLATES[key].name}
                            </span>
                            <span className="text-[9px] text-slate-500 leading-tight block mt-0.5">
                              {ER_TEMPLATES[key].description}
                            </span>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSidebarTab === 'validation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                      Integrity Check
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${schemaErrors.length === 0
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-450'
                      }`}>
                      {schemaErrors.length === 0 ? 'Passed' : `${schemaErrors.length} Issues`}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar">
                    {schemaErrors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center py-10 px-2 space-y-2 bg-slate-950/40 border border-slate-800 rounded-2xl">
                        <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                        <div>
                          <p className="font-bold text-slate-350 text-xs">Schema is Healthy</p>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-relaxed">No validation errors or primary key warnings detected in your ER layout.</p>
                        </div>
                      </div>
                    ) : (
                      schemaErrors.map((error, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex flex-col gap-2 ${error.severity === 'error'
                            ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                            : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                            }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <p className="text-[10px] leading-relaxed font-medium">
                              {error.message}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (!engine) return
                              const shape = engine.getShape(error.targetId)
                              if (shape) {
                                engine.selectShape(shape.id, false)
                                const container = document.querySelector('.canvas-viewport')
                                const rect = container ? container.getBoundingClientRect() : { width: 600, height: 600 }
                                engine.updateCamera({
                                  x: rect.width / 2 - (shape.x + shape.width / 2) * engine.camera.zoom,
                                  y: rect.height / 2 - (shape.y + shape.height / 2) * engine.camera.zoom,
                                })
                              }
                            }}
                            className="w-full bg-slate-950/80 hover:bg-slate-950 py-1 border border-white/5 hover:border-white/10 rounded-lg text-slate-300 text-[9px] font-bold cursor-pointer transition-colors"
                          >
                            Locate Table
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Content Pane Split Wrapper */}
        <div className="flex-1 flex overflow-hidden divide-x divide-slate-800">

          {/* A: Tiptap Rich Text Editor sheet (Render on 'document' or 'split') */}
          {(layoutMode === 'document' || layoutMode === 'split') && (
            <div className="flex-1 h-full overflow-hidden flex flex-col bg-slate-900/10 animate-fade-in relative">
              <CollaborativeEditor
                ydoc={ydoc}
                provider={provider}
                currentUser={currentUserData}
                placeholder="Start typing collaborative notes here... Type / for block triggers (Tables, Math equations, Mermaid flowcharts)."
              />
            </div>
          )}

          {/* B: Infinite Canvas Whiteboard area (Render on 'canvas' or 'split') */}
          {(layoutMode === 'canvas' || layoutMode === 'split') && (
            <div
              className="flex-1 h-full relative overflow-hidden canvas-viewport bg-[#0f0f11] flex flex-col"
              onWheel={handleWheel}
              onMouseMove={handleMouseMove}
              onDoubleClick={handleDoubleClick}
            >
              {/* Centered Generate AI Diagram card when canvas shapes list is empty */}
              {engine && engine.getShapes().length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10 p-4">
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate('crm')}
                    className="pointer-events-auto bg-[#131416]/95 hover:bg-[#1a1a1e] border border-white/5 hover:border-slate-800 text-slate-200 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xl flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <span>Generate AI Diagram</span>
                    <span className="text-[10px] text-slate-500 font-extrabold bg-slate-950 px-1.5 py-0.5 rounded border border-white/5">Ctrl J</span>
                  </button>
                </div>
              )}

              {/* Floating Vertical Toolbar on the left edge of the canvas */}
              {engine && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-40 bg-[#131416]/90 backdrop-blur-md border border-white/5 shadow-2xl p-1.5 rounded-xl flex flex-col items-center gap-1 w-10 select-none">
                  {/* + Insert Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      title="Insert Menu"
                      onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
                      className={`p-1 rounded-lg hover:text-slate-200 hover:bg-slate-800 cursor-pointer ${isInsertMenuOpen ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    {isInsertMenuOpen && (
                      <div className="absolute left-12 top-0 bg-[#131416]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 w-36 select-none z-50">
                        {[
                          { id: 'rectangle', label: 'Rectangle' },
                          { id: 'circle', label: 'Circle' },
                          { id: 'diamond', label: 'Diamond' },
                          { id: 'text', label: 'Text' },
                          { id: 'sticky', label: 'Sticky Frame' },
                          { id: 'er-entity', label: 'Entity' },
                          { id: 'er-relationship', label: 'Relationship' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              engine.setActiveTool(item.id)
                              setIsInsertMenuOpen(false)
                            }}
                            className="px-2.5 py-1.5 hover:bg-white/5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer text-left rounded-md transition-colors"
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Sparkles icon */}
                  <div className="flex flex-col items-center group cursor-pointer pt-0.5">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer"
                      title="Generate AI Diagram (Ctrl+J)"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-[6px] font-extrabold text-slate-600 scale-90 -mt-0.5 select-none leading-none">CTRL+J</span>
                  </div>

                  <div className="w-5 h-[1px] bg-white/5 my-0.5" />

                  {/* Standard drawing tools */}
                  {(
                    [
                      { id: 'select', label: 'Select (V)', icon: MousePointer },
                      { id: 'rectangle', label: 'Rectangle (R)', icon: Square },
                      { id: 'circle', label: 'Circle (O)', icon: CircleIcon },
                      { id: 'arrow', label: 'Arrow (A)', icon: ArrowRight },
                      { id: 'line', label: 'Line (L)', icon: Minus },
                      { id: 'text', label: 'Text (T)', icon: Type },
                      { id: 'er-entity', label: 'Entity (E)', icon: Database },
                      { id: 'er-relationship', label: 'Relationship (C)', icon: LinkIcon },
                      { id: 'sticky', label: 'Sticky Frame (F)', icon: FileText },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon
                    const isActive = engine.activeTool?.id === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={item.label}
                        onClick={() => engine.setActiveTool(item.id)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${isActive
                          ? 'bg-[#222326] text-white border border-white/5 shadow-inner'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                          }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Floating Zoom indicator at the top right of the canvas */}
              {engine && (
                <div className="absolute right-4 top-4 z-40 bg-[#131416]/90 backdrop-blur-md border border-white/5 rounded-lg shadow-xl px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-350 select-none relative">
                  <span>{Math.round(engine.camera.zoom * 100)}%</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 cursor-pointer" onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)} />
                  {isZoomMenuOpen && (
                    <div className="absolute right-0 top-8 bg-[#131416]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-1 flex flex-col gap-0.5 w-24 z-50">
                      {[0.5, 1.0, 1.5, 2.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            engine.updateCamera({ zoom: val })
                            setIsZoomMenuOpen(false)
                          }}
                          className="px-2.5 py-1.5 hover:bg-white/5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer text-center rounded transition-colors"
                        >
                          {val * 100}%
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Help button at the bottom right */}
              <button
                type="button"
                className="absolute bottom-4 right-4 w-8 h-8 bg-[#131416]/90 backdrop-blur-md border border-white/5 hover:border-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center font-bold text-[11px] shadow-2xl transition-all cursor-pointer z-40"
              >
                ?
              </button>

              {/* Canvas Guide Card */}
              <div className="absolute bottom-4 left-4 bg-[#131416]/90 backdrop-blur-md border border-white/5 p-2.5 rounded-xl text-[10px] text-slate-400 space-y-1 shadow-lg pointer-events-none z-30">
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-1">
                  <Info className="h-3 w-3 text-indigo-400" />
                  <span>Canvas Guide</span>
                </div>
                <div>• Drag with <span className="text-slate-200">Hand tool</span> or <span className="text-slate-200">Spacebar</span> to pan</div>
                <div>• Scroll <span className="text-slate-200">Mouse Wheel</span> to zoom dynamically</div>
                <div>• Double-click shapes to edit text</div>
                <div>• Click handles to resize / scale shapes</div>
              </div>

              {engine ? (
                <SvgRenderer
                  shapes={engine.getShapes()}
                  camera={engine.camera}
                  selectedIds={engine.selectedIds}
                  gridMode={engine.gridMode}
                  marquee={engine.marquee}
                  editingShapeId={editingShapeId}
                  onTextChange={(id, text) => engine.updateShape(id, { text })}
                  onTextBlur={() => setEditingShapeId(null)}
                  onPointerDown={(e) => engine.handlePointerDown(e, e.currentTarget)}
                  onPointerMove={(e) => engine.handlePointerMove(e, e.currentTarget)}
                  onPointerUp={(e) => engine.handlePointerUp(e, e.currentTarget)}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-slate-950">
                  <div className="h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar drawer toggle handle */}
        {layoutMode !== 'document' && (
          <button
            type="button"
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 z-40 bg-[#131416]/95 hover:bg-[#1a1a1e] border border-white/5 hover:border-slate-800 text-slate-400 hover:text-white w-4.5 h-10 rounded-l-lg flex items-center justify-center cursor-pointer shadow-2xl transition-all duration-300"
            style={{ right: isRightPanelCollapsed ? '0px' : '320px' }}
            title={isRightPanelCollapsed ? "Expand properties panel" : "Collapse properties panel"}
          >
            {isRightPanelCollapsed ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )}

        {/* Right Properties Panel (Only render when Canvas is active and has selection) */}
        {layoutMode !== 'document' && (
          <aside 
            className={`border-l border-[#1b1b1e] bg-[#0c0c0e]/85 p-4 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 ${
              isRightPanelCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Properties Inspector</h3>
              {hasSelection && (
                <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.5 border border-indigo-800/40 rounded text-[10px] font-semibold">
                  {selectedShapes.length} Selected
                </span>
              )}
            </div>

            {!hasSelection ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12 px-4 space-y-2">
                <Layers className="h-8 w-8 text-slate-700" />
                <div>
                  <p className="font-semibold text-slate-400 text-xs">No Selection</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">Select a shape on the canvas to inspect and edit style properties.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 text-xs text-slate-300">
                {/* 1. ER Entity properties inspector */}
                {selectedShapes.length === 1 && selectedShapes[0].type === "er-entity" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Entity Properties</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-semibold block">Table Name</label>
                      <input
                        type="text"
                        value={selectedShapes[0].text || ""}
                        onChange={(e) => updateSelectedProperty("text", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs font-semibold text-slate-200"
                      />
                    </div>

                    <hr className="border-slate-800" />

                    {/* Attributes Edit Grid */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Columns / Fields</span>
                        <button
                          type="button"
                          onClick={() => {
                            const currentAttrs = (selectedShapes[0] as any).attributes || []
                            const newAttr = {
                              id: crypto.randomUUID(),
                              name: "new_column",
                              type: "String" as any,
                              isPk: false,
                              isFk: false,
                              isNullable: true,
                              isUnique: false,
                            }
                            updateSelectedProperty("attributes", [...currentAttrs, newAttr])
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-2 py-1 rounded font-bold cursor-pointer transition-colors"
                        >
                          + Add Column
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                        {((selectedShapes[0] as any).attributes || []).map((attr: any, idx: number) => {
                          const updateAttr = (fields: Partial<typeof attr>) => {
                            const currentAttrs = [...((selectedShapes[0] as any).attributes || [])]
                            currentAttrs[idx] = { ...currentAttrs[idx], ...fields }
                            updateSelectedProperty("attributes", currentAttrs)
                          }

                          const removeAttr = () => {
                            const currentAttrs = ((selectedShapes[0] as any).attributes || []).filter((a: any) => a.id !== attr.id)
                            updateSelectedProperty("attributes", currentAttrs)
                          }

                          return (
                            <div key={attr.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-2 relative group/col">
                              {/* Row 1: Name and Trash */}
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={attr.name}
                                  onChange={(e) => updateAttr({ name: e.target.value })}
                                  className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 outline-none focus:border-indigo-500 text-xs w-full text-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={removeAttr}
                                  className="text-slate-500 hover:text-rose-450 p-0.5 rounded transition-colors cursor-pointer"
                                  title="Delete Column"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>

                              {/* Row 2: Type Selector */}
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-[9px] text-slate-500 font-semibold block">Type</label>
                                <select
                                  value={attr.type}
                                  onChange={(e) => updateAttr({ type: e.target.value as any })}
                                  className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 outline-none text-[10px] text-slate-350 w-28 focus:border-indigo-500"
                                >
                                  {["String", "Integer", "Boolean", "Float", "Decimal", "Date", "Timestamp", "UUID", "JSON"].map(t => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Row 3: Key check-badges */}
                              <div className="flex items-center gap-3.5 text-[9px] text-slate-400">
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={attr.isPk}
                                    onChange={(e) => updateAttr({ isPk: e.target.checked })}
                                    className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20"
                                  />
                                  <span>PK</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={attr.isFk}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked
                                      if (!isChecked) {
                                        updateAttr({ isFk: false, fkReference: null })
                                      } else {
                                        updateAttr({ isFk: true })
                                      }
                                    }}
                                    className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20"
                                  />
                                  <span>FK</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={attr.isNullable}
                                    onChange={(e) => updateAttr({ isNullable: e.target.checked })}
                                    className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20"
                                  />
                                  <span>Null</span>
                                </label>
                                <label className="flex items-center gap-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={attr.isUnique}
                                    onChange={(e) => updateAttr({ isUnique: e.target.checked })}
                                    className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-indigo-500/20"
                                  />
                                  <span>UQ</span>
                                </label>
                              </div>

                              {/* FK target entities layout picker */}
                              {attr.isFk && (
                                <div className="space-y-1 pt-1.5 border-t border-slate-900 text-[10px]">
                                  <span className="text-[9px] text-slate-500 block">FK Target:</span>
                                  <div className="grid grid-cols-2 gap-1.5">
                                    <select
                                      value={attr.fkReference?.entityId || ""}
                                      onChange={(e) => {
                                        const refId = e.target.value
                                        const refEnt = erEntities.find(ent => ent.id === refId)
                                        const firstAttr = refEnt?.attributes[0]
                                        updateAttr({
                                          fkReference: {
                                            entityId: refId,
                                            attributeId: firstAttr?.id || "",
                                          }
                                        })
                                      }}
                                      className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 outline-none text-[9px] text-slate-350 focus:border-indigo-500 w-full"
                                    >
                                      <option value="">Select Table...</option>
                                      {erEntities.filter(ent => ent.id !== selectedShapes[0].id).map(ent => (
                                        <option key={ent.id} value={ent.id}>{ent.name}</option>
                                      ))}
                                    </select>

                                    <select
                                      value={attr.fkReference?.attributeId || ""}
                                      onChange={(e) => {
                                        if (attr.fkReference) {
                                          updateAttr({
                                            fkReference: {
                                              ...attr.fkReference,
                                              attributeId: e.target.value,
                                            }
                                          })
                                        }
                                      }}
                                      className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 outline-none text-[9px] text-slate-350 focus:border-indigo-500 w-full"
                                      disabled={!attr.fkReference?.entityId}
                                    >
                                      <option value="">Select Key...</option>
                                      {(erEntities.find(ent => ent.id === attr.fkReference?.entityId)?.attributes || []).map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ER Relationship properties inspector */}
                {selectedShapes.length === 1 && selectedShapes[0].type === "er-relationship" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Relationship Settings</span>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-semibold block">Label / Verb</label>
                      <input
                        type="text"
                        value={(selectedShapes[0] as any).label || ""}
                        placeholder="e.g. references, belongs to"
                        onChange={(e) => updateSelectedProperty("label", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">Source Card.</label>
                        <select
                          value={(selectedShapes[0] as any).sourceCardinality || "1"}
                          onChange={(e) => updateSelectedProperty("sourceCardinality", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-350"
                        >
                          {["1", "0..1", "*", "1..*", "0..*"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">Target Card.</label>
                        <select
                          value={(selectedShapes[0] as any).targetCardinality || "*"}
                          onChange={(e) => updateSelectedProperty("targetCardinality", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 text-xs text-slate-350"
                        >
                          {["1", "0..1", "*", "1..*", "0..*"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1.5">
                      <input
                        type="checkbox"
                        id="identifying-check"
                        checked={(selectedShapes[0] as any).identifying ?? true}
                        onChange={(e) => updateSelectedProperty("identifying", e.target.checked)}
                        className="rounded border-slate-805 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20"
                      />
                      <label htmlFor="identifying-check" className="text-[10px] text-slate-400 font-semibold cursor-pointer select-none">
                        Identifying Relationship
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. Generic shape aesthetics & geometry */}
                {selectedShapes.length === 1 && selectedShapes[0].type !== "er-entity" && selectedShapes[0].type !== "er-relationship" && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Dimensions Section */}
                    <div className="space-y-3">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Geometry</span>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold block">Position X</label>
                          <input
                            type="number"
                            value={activeProperties.x}
                            onChange={(e) => updateSelectedProperty('x', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold block">Position Y</label>
                          <input
                            type="number"
                            value={activeProperties.y}
                            onChange={(e) => updateSelectedProperty('y', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold block">Width</label>
                          <input
                            type="number"
                            value={activeProperties.width}
                            onChange={(e) => updateSelectedProperty('width', parseFloat(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-500 font-semibold block">Height</label>
                          <input
                            type="number"
                            value={activeProperties.height}
                            onChange={(e) => updateSelectedProperty('height', parseFloat(e.target.value) || 1)}
                            className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">Rotation (degrees)</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={activeProperties.rotation}
                          onChange={(e) => updateSelectedProperty('rotation', parseInt(e.target.value) || 0)}
                          className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>0°</span>
                          <span className="text-slate-300 font-bold">{activeProperties.rotation}°</span>
                          <span>360°</span>
                        </div>
                      </div>
                    </div>

                    <hr className="border-slate-800" />

                    {/* Typography / Text Content Section */}
                    <div className="space-y-2">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Text Content</span>
                      <textarea
                        value={activeProperties.text}
                        placeholder="No text label"
                        onChange={(e) => updateSelectedProperty('text', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 outline-none focus:border-indigo-500 transition-colors resize-none h-16"
                      />
                    </div>

                    <hr className="border-slate-800" />

                    {/* Styles Section */}
                    <div className="space-y-4">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Aesthetics</span>

                      {/* Fill Swatches */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold block">Fill Color</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { hex: 'transparent', name: 'None' },
                              { hex: 'rgba(99,102,241,0.15)', name: 'Indigo tint' },
                              { hex: '#fef08a', name: 'Yellow' },
                              { hex: '#fbcfe8', name: 'Pink' },
                              { hex: '#bbf7d0', name: 'Green' },
                              { hex: '#bfdbfe', name: 'Blue' },
                              { hex: '#1e293b', name: 'Dark Slate' },
                              { hex: '#0f172a', name: 'Deep Dark' },
                            ]
                          ).map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => updateSelectedProperty('fill', color.hex)}
                              title={color.name}
                              className={`w-5 h-5 rounded border transition-transform cursor-pointer hover:scale-110 ${activeProperties.fill === color.hex ? 'border-white scale-110 ring-1 ring-indigo-500' : 'border-slate-800'
                                }`}
                              style={{ backgroundColor: color.hex === 'transparent' ? 'transparent' : color.hex }}
                            >
                              {color.hex === 'transparent' && <span className="text-[8px] text-slate-500">🚫</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Stroke Swatches */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold block">Border / Stroke Color</label>
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              { hex: '#6366f1', name: 'Indigo' },
                              { hex: '#3b82f6', name: 'Blue' },
                              { hex: '#10b981', name: 'Emerald' },
                              { hex: '#eab308', name: 'Yellow' },
                              { hex: '#ef4444', name: 'Red' },
                              { hex: '#f43f5e', name: 'Rose' },
                              { hex: '#ffffff', name: 'White' },
                              { hex: '#64748b', name: 'Slate' },
                            ]
                          ).map((color) => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => updateSelectedProperty('stroke', color.hex)}
                              title={color.name}
                              className={`w-5 h-5 rounded border transition-transform cursor-pointer hover:scale-110 ${activeProperties.stroke === color.hex ? 'border-white scale-110 ring-1 ring-indigo-500' : 'border-slate-800'
                                }`}
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Stroke Width */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">Border Width</label>
                        <div className="flex gap-1.5">
                          {[1, 2, 4, 8].map((width) => (
                            <button
                              key={width}
                              type="button"
                              onClick={() => updateSelectedProperty('strokeWidth', width)}
                              className={`flex-1 py-1 px-2 border rounded transition-colors text-center cursor-pointer ${activeProperties.strokeWidth === width
                                ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                              {width}px
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Opacity */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-semibold block">Opacity</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={activeProperties.opacity * 100}
                          onChange={(e) => updateSelectedProperty('opacity', parseFloat(e.target.value) / 100)}
                          className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>0%</span>
                          <span className="text-slate-300 font-bold">{Math.round(activeProperties.opacity * 100)}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <hr className="border-slate-800" />

                {/* Actions Section */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => engine?.deleteSelectedShapes()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-200 rounded font-semibold transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Shapes</span>
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Right Collapsible Comments Sidebar */}
        {showComments && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Comments & Annotations</h3>
              <span className="bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                Beta
              </span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-12 px-4 space-y-2">
              <MessageSquare className="h-8 w-8 text-slate-700" />
              <div>
                <p className="font-semibold text-slate-400 text-xs">No comments yet</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Annotations and inline comments will be integrated in Phase 6.</p>
              </div>
            </div>
          </aside>
        )}

        {/* Snapshots Sidebar (Original) */}
        {showSnapshots && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col overflow-y-auto animate-slide-in">
            <h3 className="text-sm font-bold text-white mb-3">Snapshot History</h3>
            <p className="text-xs text-slate-500 mb-4">
              Restoring a snapshot replaces the current document collaboration state with a saved checkpoint binary.
            </p>
            <div className="space-y-3 flex-1">
              {snapshots.length === 0 ? (
                <div className="text-xs text-slate-600 italic text-center py-6">
                  No snapshots taken yet.
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-300 block">
                        Snapshot by User {snap.creatorId.substring(0, 8)}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(snap.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium transition-colors cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Status Bar */}
      <footer className="px-6 py-2 border-t border-slate-850 bg-slate-950/60 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-4">
          {layoutMode !== 'document' ? (
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <MousePointer className="h-3 w-3 text-indigo-400" />
              <span>X: {Math.round(mouseWorldPos.x)}, Y: {Math.round(mouseWorldPos.y)}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <BookOpen className="h-3 w-3 text-indigo-400" />
              <span>Document Editor Active</span>
            </span>
          )}
          <span>•</span>
          <span>Zoom: {engine ? Math.round(engine.camera.zoom * 100) : 100}%</span>
          <span>•</span>
          <span>Shapes: {engine?.getShapes().length || 0}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
            <span className="text-slate-400">Engine V0.4 (Tiptap + Yjs Sync)</span>
          </div>
          <span>•</span>
          <span className="text-slate-600">Eraser.io Clone Editor</span>
        </div>
      </footer>
    </div>
  )
}
