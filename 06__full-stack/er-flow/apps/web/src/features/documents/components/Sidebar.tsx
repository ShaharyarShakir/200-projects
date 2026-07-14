import React, { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Folder as FolderIcon,
  FolderPlus,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Move,
  FileText,
  Plus,
  Layers
} from "lucide-react";
import {
  useDocuments,
  useFolders,
  useCreateDocument,
  useCreateFolder,
  useDeleteDocument,
  useDeleteFolder,
  useUpdateDocument,
  useUpdateFolder
} from "../api/documents.js";

interface SidebarProps {
  workspaceId: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ workspaceId }) => {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activeDocumentId = (params as any).documentId;

  // Data queries
  const { data: documents = [], isLoading: docsLoading } = useDocuments(workspaceId);
  const { data: folders = [], isLoading: foldersLoading } = useFolders(workspaceId);

  // Mutations
  const createDocMutation = useCreateDocument();
  const createFolderMutation = useCreateFolder();
  const deleteDocMutation = useDeleteDocument();
  const deleteFolderMutation = useDeleteFolder();
  const updateDocMutation = useUpdateDocument();
  const updateFolderMutation = useUpdateFolder();

  // Component UI State
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = () => {
    const name = "Untitled Folder";
    createFolderMutation.mutate(
      {
        name,
        workspaceId,
      },
      {
        onSuccess: (newFolder: any) => {
          const folderId = newFolder.id || newFolder._id;
          setEditingFolderId(folderId);
          setRenameValue(name);
        },
      }
    );
  };

  const handleCreateDocument = (folderId?: string | null) => {
    const title = "Untitled Document";
    createDocMutation.mutate(
      {
        title,
        workspaceId,
        folderId,
      },
      {
        onSuccess: (newDoc: any) => {
          const docId = newDoc.id || newDoc._id;
          navigate({
            to: `/workspaces/${workspaceId}/documents/${docId}`,
          });
        },
      }
    );
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this folder? All child documents will be moved to the root.")) return;
    deleteFolderMutation.mutate({ id: folderId, workspaceId });
  };

  const handleDeleteDoc = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this document?")) return;
    deleteDocMutation.mutate({ id: docId, workspaceId });
  };

  const handleMoveDoc = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const folderList = folders.map(f => `${f.name} (ID: ${f.id})`).join("\n");
    const targetFolderId = prompt(
      `Enter target Folder ID to move this document to (leave empty to move to root):\n\nAvailable Folders:\n${folderList}`
    );
    if (targetFolderId === null) return;
    updateDocMutation.mutate({
      id: docId,
      data: { folderId: targetFolderId.trim() || null },
    });
  };

  const startRenameFolder = (e: React.MouseEvent, folderId: string, currentName: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingFolderId(folderId);
    setRenameValue(currentName);
  };

  const saveRenameFolder = (folderId: string) => {
    if (renameValue.trim()) {
      updateFolderMutation.mutate({
        id: folderId,
        data: { name: renameValue.trim() },
      });
    }
    setEditingFolderId(null);
  };

  const startRenameDoc = (e: React.MouseEvent, docId: string, currentTitle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingDocId(docId);
    setRenameValue(currentTitle);
  };

  const saveRenameDoc = (docId: string) => {
    if (renameValue.trim()) {
      updateDocMutation.mutate({
        id: docId,
        data: { title: renameValue.trim() },
      });
    }
    setEditingDocId(null);
  };

  // Group root documents and documents inside folders
  const rootDocs = documents.filter(d => !d.folderId && !d.isArchived);
  const getFolderDocs = (folderId: string) => documents.filter(d => d.folderId === folderId && !d.isArchived);

  return (
    <aside className="w-64 bg-[#0f0f11] border-r border-[#1b1b1e] flex flex-col h-full text-slate-350 font-sans shadow-2xl relative select-none">
      {/* 1. Top Team Selector block */}
      <div className="p-3 border-b border-[#1b1b1e]">
        <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Double pill Eraser Logo */}
            <div className="flex flex-col justify-between w-4 h-4 transform -rotate-12 flex-shrink-0">
              <div className="h-1.2 w-3.5 bg-red-500 rounded-full" />
              <div className="h-1.2 w-3.5 bg-sky-500 rounded-full translate-x-1" />
            </div>
            <span className="text-xs font-bold text-slate-200 truncate tracking-wide">
              Shaharyar's Team
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </div>
      </div>

      {/* 2. All Files option item */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => navigate({ to: `/workspaces/${workspaceId}` })}
          className="w-full bg-[#222326] hover:bg-[#2b2c30] text-slate-200 hover:text-white flex items-center justify-between px-3 py-2 rounded-lg font-bold text-xs border border-white/5 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>All Files</span>
          </div>
          <span className="bg-[#131416] border border-white/5 px-1 py-0.5 rounded text-[8px] font-extrabold text-slate-500 leading-none">
            A
          </span>
        </button>
      </div>

      {/* 3. Explorer Tree Header */}
      <div className="px-4 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-500">
          <FolderIcon className="h-3 w-3" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Team Folders</span>
        </div>
        <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCreateFolder}
            title="Create Folder"
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleCreateDocument(null)}
            title="Create Document"
            className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Explorer Tree content */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
        {/* Folders List */}
        {foldersLoading ? (
          <div className="text-[10px] text-slate-650 px-3 py-2">Loading folders...</div>
        ) : folders.length === 0 && rootDocs.length === 0 ? (
          <div className="text-[10px] text-slate-600 px-3 py-4 italic text-center">
            No folders or root documents yet.
          </div>
        ) : (
          <>
            {folders.map(folder => {
              const folderId = folder.id || (folder as any)._id;
              const isCollapsed = collapsedFolders[folderId];
              const folderDocs = getFolderDocs(folderId);

              return (
                <div key={folderId} className="space-y-0.5">
                  <div
                    onClick={() => toggleFolder(folderId)}
                    className="group flex items-center justify-between px-2.5 py-1.5 hover:bg-white/5 rounded-lg cursor-pointer text-xs font-semibold transition-all text-slate-350 hover:text-white"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-slate-500 flex-shrink-0" />
                      )}
                      <FolderIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      
                      {editingFolderId === folderId ? (
                        <input
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onBlur={() => saveRenameFolder(folderId)}
                          onKeyDown={e => e.key === "Enter" && saveRenameFolder(folderId)}
                          autoFocus
                          className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-white text-[11px] w-full outline-none focus:border-indigo-500"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{folder.name}</span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateDocument(folderId);
                        }}
                        title="Add Document"
                        className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => startRenameFolder(e, folderId, folder.name)}
                        title="Rename"
                        className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Edit2 className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteFolder(e, folderId)}
                        title="Delete"
                        className="p-0.5 hover:text-rose-450 hover:bg-slate-800 rounded transition-colors"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="pl-3.5 border-l border-dashed border-slate-800/80 ml-4 mt-0.5 space-y-0.5">
                      {folderDocs.map(doc => {
                        const docId = doc.id || (doc as any)._id;
                        const isActive = activeDocumentId === docId;
                        return (
                          <div
                            key={docId}
                            className={`group flex items-center justify-between px-2 py-1 hover:bg-white/5 rounded text-[11px] transition-colors border border-transparent ${
                              isActive
                                ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-300 font-bold"
                                : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            <Link
                              to="/workspaces/$workspaceId/documents/$documentId"
                              params={{ workspaceId, documentId: docId }}
                              className="flex items-center gap-1.5 overflow-hidden flex-1 py-0.5"
                            >
                              <FileText className={`h-3 w-3 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                              {editingDocId === docId ? (
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={e => setRenameValue(e.target.value)}
                                  onBlur={() => saveRenameDoc(docId)}
                                  onKeyDown={e => e.key === "Enter" && saveRenameDoc(docId)}
                                  autoFocus
                                  className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-white text-[10px] w-full outline-none focus:border-indigo-500"
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <span className="truncate">{doc.title}</span>
                              )}
                            </Link>

                            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity flex-shrink-0">
                              <button
                                type="button"
                                onClick={(e) => startRenameDoc(e, docId, doc.title)}
                                className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit2 className="h-2 w-2" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleMoveDoc(e, docId)}
                                className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                                title="Move"
                              >
                                <Move className="h-2 w-2" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteDoc(e, docId)}
                                className="p-0.5 hover:text-rose-450 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {folderDocs.length === 0 && (
                        <div className="text-[9px] text-slate-650 italic py-0.5 px-2">Empty folder</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {rootDocs.map(doc => {
              const docId = doc.id || (doc as any)._id;
              const isActive = activeDocumentId === docId;
              return (
                <div
                  key={docId}
                  className={`group flex items-center justify-between px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-xs font-semibold transition-colors border border-transparent ${
                    isActive
                      ? "bg-indigo-600/10 border-indigo-500/20 text-indigo-300 font-bold"
                      : "text-slate-350 hover:text-slate-200"
                  }`}
                >
                  <Link
                    to="/workspaces/$workspaceId/documents/$documentId"
                    params={{ workspaceId, documentId: docId }}
                    className="flex items-center gap-2 overflow-hidden flex-1 py-0.5"
                  >
                    <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {editingDocId === docId ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => saveRenameDoc(docId)}
                        onKeyDown={e => e.key === "Enter" && saveRenameDoc(docId)}
                        autoFocus
                        className="bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-white text-[11px] w-full outline-none focus:border-indigo-500"
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{doc.title}</span>
                    )}
                  </Link>

                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => startRenameDoc(e, docId, doc.title)}
                      className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit2 className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleMoveDoc(e, docId)}
                      className="p-0.5 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                      title="Move"
                    >
                      <Move className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDoc(e, docId)}
                      className="p-0.5 hover:text-rose-450 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 5. Bottom utilities links section */}
      <div className="p-3 border-t border-[#1b1b1e] space-y-0.5">
        {[
          { label: "Eraserbot", badge: "BETA", shortcut: "R", hasSparkle: true },
          { label: "AI Presets", shortcut: "T" },
          { label: "Custom Styles", shortcut: "S" },
          { label: "Github Sync", badge: "BETA", shortcut: "G" },
          { label: "Private Files", badge: "UPGRADE" },
          { label: "Archive", shortcut: "E" },
          { label: "MCP", shortcut: "C" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-white/5 text-[11px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`px-1 py-0.2 rounded text-[7px] font-extrabold ${
                  item.badge === "UPGRADE" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-indigo-500/15 text-indigo-400"
                }`}>
                  {item.badge}
                </span>
              )}
            </div>
            {item.shortcut && (
              <span className="text-[9px] text-slate-600 font-bold font-mono">{item.shortcut}</span>
            )}
          </div>
        ))}
      </div>

      {/* 6. "New File Alt N" blue dropdown button */}
      <div className="px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => handleCreateDocument(null)}
          className="w-full bg-[#2f68fa] hover:bg-[#1d57e6] border border-[#3b75ff] hover:border-[#2f68fa] text-white flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold shadow-lg shadow-[#2f68fa]/10 transition-all cursor-pointer"
        >
          <span>New File</span>
          <div className="flex items-center gap-1 opacity-80">
            <span className="text-[9px] font-extrabold tracking-wide uppercase">Alt N</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </button>
      </div>
    </aside>
  );
};
