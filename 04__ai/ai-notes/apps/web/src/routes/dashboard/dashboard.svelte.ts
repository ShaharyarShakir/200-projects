import { createQuery, createMutation } from "@tanstack/svelte-query";
import { queryClient, notebooksApi, notesApi } from "../../lib/api.js";

export function createDashboardState() {
  // Layout states for responsive views
  let showMobileSidebar = $state(false);
  let showMobileNotes = $state(true);

  // Selection states
  let currentView = $state<"all" | "favorites" | "trash" | "notebook">("all");
  let selectedNotebookId = $state<string | null>(null);
  let selectedNoteId = $state<string | null>(null);
  let searchQuery = $state("");
  let saveStatus = $state<"saved" | "saving" | "offline">("saved");

  // --- TANSTACK QUERIES ---
  const notebooksQuery = createQuery<any[], Error>(() => ({
    queryKey: ["notebooks"],
    queryFn: notebooksApi.list,
  }));

  const notesQuery = createQuery<any[], Error>(() => ({
    queryKey: ["notes"],
    queryFn: notesApi.list,
  }));

  const trashQuery = createQuery<any[], Error>(() => ({
    queryKey: ["trash"],
    queryFn: notesApi.listTrash,
  }));

  // --- TANSTACK MUTATIONS ---
  const createNotebookMutation = createMutation<any, Error, { name: string; color: string; icon: string }>(() => ({
    mutationFn: (args: { name: string; color: string; icon: string }) =>
      notebooksApi.create(args.name, args.icon, args.color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
    },
  }));

  const deleteNotebookMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notebooksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notebooks"] });
      // If we deleted the active notebook view, switch back to 'all'
      if (currentView === "notebook") {
        currentView = "all";
        selectedNotebookId = null;
      }
    },
  }));

  const createNoteMutation = createMutation<any, Error, { title: string; notebookId: string | null }>(() => ({
    mutationFn: (args: { title: string; notebookId: string | null }) =>
      notesApi.create(args.title, args.notebookId),
    onSuccess: (newNote: any) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      selectedNoteId = newNote.id;
      // Navigate list pane to editor on small screens
      showMobileNotes = false;
    },
  }));

  const updateNoteMutation = createMutation<any, Error, { id: string; updates: any }>(() => ({
    mutationFn: (args: { id: string; updates: any }) =>
      notesApi.update(args.id, args.updates),
    onMutate: () => {
      saveStatus = "saving";
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      saveStatus = "saved";
    },
    onError: () => {
      saveStatus = "offline";
    },
  }));

  const softDeleteNoteMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notesApi.softDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      if (selectedNoteId) selectedNoteId = null;
    },
  }));

  const restoreNoteMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notesApi.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
  }));

  const permanentDeleteNoteMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notesApi.permanentDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      if (selectedNoteId) selectedNoteId = null;
    },
  }));

  const toggleFavoriteNoteMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notesApi.toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  }));

  const togglePinNoteMutation = createMutation<any, Error, string>(() => ({
    mutationFn: notesApi.togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  }));

  // --- COMPUTED / DERIVED DATA ---
  const sortedNotes = $derived.by(() => {
    let list = [];
    if (currentView === "trash") {
      list = (trashQuery.data as any[]) || [];
    } else if (currentView === "favorites") {
      list = ((notesQuery.data as any[]) || []).filter((n: any) => n.isFavorite);
    } else if (currentView === "notebook") {
      list = ((notesQuery.data as any[]) || []).filter((n: any) => n.notebookId === selectedNotebookId);
    } else {
      list = (notesQuery.data as any[]) || [];
    }

    // Client-side search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          (n.content && JSON.stringify(n.content).toLowerCase().includes(q)),
      );
    }

    // Sort pinned notes to the top, then sort by updatedAt timestamp descending
    return [...list].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  });

  const activeNote = $derived(
    ((notesQuery.data as any[]) || []).find((n: any) => n.id === selectedNoteId) ||
      ((trashQuery.data as any[]) || []).find((n: any) => n.id === selectedNoteId),
  );

  return {
    // Getters and Setters
    get showMobileSidebar() { return showMobileSidebar; },
    set showMobileSidebar(v) { showMobileSidebar = v; },
    get showMobileNotes() { return showMobileNotes; },
    set showMobileNotes(v) { showMobileNotes = v; },
    get currentView() { return currentView; },
    set currentView(v) { currentView = v; },
    get selectedNotebookId() { return selectedNotebookId; },
    set selectedNotebookId(v) { selectedNotebookId = v; },
    get selectedNoteId() { return selectedNoteId; },
    set selectedNoteId(v) { selectedNoteId = v; },
    get searchQuery() { return searchQuery; },
    set searchQuery(v) { searchQuery = v; },
    get saveStatus() { return saveStatus; },
    set saveStatus(v) { saveStatus = v; },

    // Data getters
    get notebooks() { return notebooksQuery.data || []; },
    get notes() { return notesQuery.data || []; },
    get trash() { return trashQuery.data || []; },
    get sortedNotes() { return sortedNotes; },
    get activeNote() { return activeNote; },

    // Actions
    selectView(view: "all" | "favorites" | "trash" | "notebook", notebookId: string | null) {
      currentView = view;
      selectedNotebookId = notebookId;
      selectedNoteId = null;
      showMobileSidebar = false;
      showMobileNotes = true;
    },

    createNotebook(name: string, color: string, icon: string) {
      createNotebookMutation.mutate({ name, color, icon });
    },

    deleteNotebook(id: string) {
      deleteNotebookMutation.mutate(id);
    },

    createNote() {
      if (currentView === "trash") return;
      createNoteMutation.mutate({
        title: "Untitled Note",
        notebookId: currentView === "notebook" ? selectedNotebookId : null,
      });
    },

    saveNote(id: string, updates: any) {
      updateNoteMutation.mutate({ id, updates });
    },

    softDeleteNote(id: string) {
      softDeleteNoteMutation.mutate(id);
    },

    restoreNote(id: string) {
      restoreNoteMutation.mutate(id);
    },

    permanentDeleteNote(id: string) {
      permanentDeleteNoteMutation.mutate(id);
    },

    toggleFavoriteNote(id: string) {
      toggleFavoriteNoteMutation.mutate(id);
    },

    togglePinNote(id: string) {
      togglePinNoteMutation.mutate(id);
    },
  };
}
