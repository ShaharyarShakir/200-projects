<script lang="ts">
  interface Notebook {
    id: string;
    name: string;
    icon: string;
    color: string;
  }

  interface Note {
    id: string;
    title: string;
    summary?: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    updatedAt: string;
  }

  interface Props {
    notebooks: Notebook[];
    notes: Note[];
    selectedNotebookId: string | null;
    selectedNoteId: string | null;
    currentView: "all" | "favorites" | "trash" | "notebook";
    searchQuery: string;
    onselectView: (view: "all" | "favorites" | "trash" | "notebook", id: string | null) => void;
    onselectNote: (id: string) => void;
    oncreateNote: () => void;
    oncreateNotebook: (name: string, color: string, icon: string) => void;
    ondeleteNotebook: (id: string) => void;
    ontoggleFavorite: (id: string) => void;
    ontogglePin: (id: string) => void;
    onsoftDelete: (id: string) => void;
  }

  let {
    notebooks = [],
    notes = [],
    selectedNotebookId,
    selectedNoteId,
    currentView,
    searchQuery = $bindable(""),
    onselectView,
    onselectNote,
    oncreateNote,
    oncreateNotebook,
    ondeleteNotebook,
    ontoggleFavorite,
    ontogglePin,
    onsoftDelete,
  }: Props = $props();

  let showAddNotebook = $state(false);
  let newNotebookName = $state("");
  let newNotebookColor = $state("violet");
  let newNotebookIcon = $state("📁");

  // Keep track of active note action menu popover
  let activeMenuNoteId = $state<string | null>(null);

  const colors = [
    { name: "violet", class: "bg-violet-500" },
    { name: "indigo", class: "bg-indigo-500" },
    { name: "fuchsia", class: "bg-fuchsia-500" },
    { name: "emerald", class: "bg-emerald-500" },
    { name: "amber", class: "bg-amber-500" },
    { name: "rose", class: "bg-rose-500" },
  ];

  function handleCreateNotebook(e: Event) {
    e.preventDefault();
    if (!newNotebookName.trim()) return;
    oncreateNotebook(newNotebookName.trim(), newNotebookColor, newNotebookIcon);
    newNotebookName = "";
    showAddNotebook = false;
  }

  function getGroupedNotes(notesList: Note[]) {
    const today: Note[] = [];
    const yesterday: Note[] = [];
    const older: Note[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    // Filter out pinned notes for date grouping to prevent duplicates
    const nonPinnedNotes = notesList.filter(n => !n.isPinned);

    nonPinnedNotes.forEach(n => {
      const updateTime = new Date(n.updatedAt).getTime();
      if (updateTime >= todayStart) {
        today.push(n);
      } else if (updateTime >= yesterdayStart) {
        yesterday.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, older };
  }

  const pinnedNotes = $derived(notes.filter(n => n.isPinned));
  const grouped = $derived(getGroupedNotes(notes));
</script>

<div class="w-72 bg-slate-50/50 dark:bg-slate-900/40 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full shrink-0 select-none transition-colors duration-200">
  <!-- Sidebar Branding & Header -->
  <div class="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-200">
    <div class="flex items-center gap-2.5">
      <span class="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight font-sans">Notelify</span>
    </div>
    <!-- Small Collapse Sidebar Icon -->
    <button
      class="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
      aria-label="Collapse sidebar"
      title="Collapse sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    </button>
  </div>

  <!-- Search Input & Action Button Container -->
  <div class="p-4 space-y-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
    <div class="relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
        </svg>
      </span>
      <input
        type="text"
        placeholder="Search notes or projects..."
        bind:value={searchQuery}
        class="w-full light-input dark:bg-slate-900 dark:border-slate-850 dark:text-white dark:focus:bg-slate-950 rounded-xl pl-9 pr-4 py-2 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-600"
      />
    </div>

    <!-- Solid Purple New Note Button -->
    <button
      onclick={oncreateNote}
      class="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer hover:shadow active:scale-98"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      New Note
    </button>
  </div>

  <!-- Sidebar Lists Scroll Area -->
  <div class="flex-grow overflow-y-auto p-4 space-y-5 scrollbar-thin">
    
    <!-- 1. PROJECTS (Notebooks) SECTION -->
    <div class="space-y-1.5">
      <div class="flex items-center justify-between px-2 mb-1.5">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Projects</span>
        <button
          onclick={() => (showAddNotebook = !showAddNotebook)}
          class="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
          title="Add Project"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>

      <!-- Add Notebook Inline Popover Form -->
      {#if showAddNotebook}
        <form
          onsubmit={handleCreateNotebook}
          class="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-3 space-y-2.5 mb-2.5 shadow-sm animate-fade-in"
        >
          <input
            type="text"
            placeholder="Project name..."
            bind:value={newNotebookName}
            required
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-805 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-violet-500"
          />
          <div class="flex items-center justify-between gap-2">
            <!-- Colors list -->
            <div class="flex items-center gap-1">
              {#each colors as c}
                <button
                  type="button"
                  onclick={() => (newNotebookColor = c.name)}
                  class="w-3 h-3 rounded-full transition-transform cursor-pointer {c.class}"
                  class:scale-125={newNotebookColor === c.name}
                  class:ring-1={newNotebookColor === c.name}
                  class:ring-slate-400={newNotebookColor === c.name}
                  aria-label={c.name}
                  title={c.name}
                ></button>
              {/each}
            </div>
            <div class="flex gap-1.5 shrink-0">
              <button
                type="button"
                onclick={() => (showAddNotebook = false)}
                class="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-2 py-1 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-[10px] px-2 py-1 rounded cursor-pointer"
              >
                Create
              </button>
            </div>
          </div>
        </form>
      {/if}

      <!-- Projects Lists -->
      <div class="space-y-0.5">
        {#each notebooks as n}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            onclick={() => onselectView("notebook", n.id)}
            class="group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-150 {(currentView === 'notebook' && selectedNotebookId === n.id) ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:text-slate-700 dark:hover:text-slate-200'}"
          >
            <span class="flex items-center gap-2 truncate">
              <!-- Emojis/custom colored icons -->
              <span class="text-sm shrink-0">{n.icon || "📁"}</span>
              <span class="truncate">{n.name}</span>
            </span>

            <!-- Delete Notebook button -->
            <button
              onclick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete project "${n.name}"?`)) {
                  ondeleteNotebook(n.id);
                }
              }}
              class="opacity-0 group-hover:opacity-100 hover:text-red-650 transition-opacity p-0.5 rounded text-slate-400 cursor-pointer"
              title="Delete Project"
            >
              🗑
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- 2. PINNED SECTION -->
    {#if pinnedNotes.length > 0}
      <div class="space-y-1">
        <div class="flex items-center gap-1.5 px-2 mb-1">
          <span class="text-slate-400 text-xs">📌</span>
          <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pinned</span>
        </div>
        <div class="space-y-0.5">
          {#each pinnedNotes as n}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={() => onselectNote(n.id)}
              class="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 border border-transparent {selectedNoteId === n.id ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
            >
              <span class="truncate">{n.title || "Untitled Note"}</span>
              
              <!-- Quick Favorite toggle on Pinned notes -->
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  ontogglePin(n.id);
                }}
                class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-yellow-600 p-0.5 rounded cursor-pointer"
                title="Unpin"
              >
                ⭐
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- 3. DATE GROUPED LISTS (Today, Yesterday, Older) -->
    <!-- TODAY -->
    {#if grouped.today.length > 0}
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">Today</span>
        <div class="space-y-0.5">
          {#each grouped.today as n}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={() => onselectNote(n.id)}
              class="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 border border-transparent relative {selectedNoteId === n.id ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
            >
              <div class="flex flex-col truncate w-full pr-4">
                <span class="truncate font-medium">{n.title || "Untitled Note"}</span>
                {#if n.summary}
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-light truncate mt-0.5">{n.summary}</span>
                {/if}
              </div>

              <!-- Note inline Action popover toggles -->
              <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 shrink-0">
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    ontogglePin(n.id);
                  }}
                  class="hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                  title="Pin Note"
                >
                  📌
                </button>
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    onsoftDelete(n.id);
                  }}
                  class="hover:text-red-500 p-0.5 rounded cursor-pointer"
                  title="Trash Note"
                >
                  🗑
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- YESTERDAY -->
    {#if grouped.yesterday.length > 0}
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">Yesterday</span>
        <div class="space-y-0.5">
          {#each grouped.yesterday as n}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={() => onselectNote(n.id)}
              class="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 border border-transparent {selectedNoteId === n.id ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
            >
              <div class="flex flex-col truncate w-full pr-4">
                <span class="truncate font-medium">{n.title || "Untitled Note"}</span>
                {#if n.summary}
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-light truncate mt-0.5">{n.summary}</span>
                {/if}
              </div>

              <!-- Action popovers -->
              <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 shrink-0">
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    ontogglePin(n.id);
                  }}
                  class="hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                  title="Pin Note"
                >
                  📌
                </button>
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    onsoftDelete(n.id);
                  }}
                  class="hover:text-red-500 p-0.5 rounded cursor-pointer"
                  title="Trash Note"
                >
                  🗑
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- OLDER -->
    {#if grouped.older.length > 0}
      <div class="space-y-1">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 block mb-1">Older</span>
        <div class="space-y-0.5">
          {#each grouped.older as n}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              onclick={() => onselectNote(n.id)}
              class="group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 border border-transparent {selectedNoteId === n.id ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm text-slate-800 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}"
            >
              <div class="flex flex-col truncate w-full pr-4">
                <span class="truncate font-medium">{n.title || "Untitled Note"}</span>
                {#if n.summary}
                  <span class="text-[10px] text-slate-400 dark:text-slate-500 font-light truncate mt-0.5">{n.summary}</span>
                {/if}
              </div>

              <!-- Action popovers -->
              <div class="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-slate-400 shrink-0">
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    ontogglePin(n.id);
                  }}
                  class="hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
                  title="Pin Note"
                >
                  📌
                </button>
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    onsoftDelete(n.id);
                  }}
                  class="hover:text-red-500 p-0.5 rounded cursor-pointer"
                  title="Trash Note"
                >
                  🗑
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

  </div>
</div>
