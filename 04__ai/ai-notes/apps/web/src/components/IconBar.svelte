<script lang="ts">
  interface Props {
    activeTab?: string;
    onchangeTab?: (tab: string) => void;
  }

  let { activeTab = "notes", onchangeTab }: Props = $props();

  const menuItems = [
    {
      id: "ai",
      label: "AI Assistant",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.188-.904L9 9l.813 5.096L15 15l-5.188.904z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.071 4.929a10 10 0 00-14.142 0M12 3v2M12 19v2M3 12h2M19 12h2" /></svg>`,
    },
    {
      id: "home",
      label: "Home",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>`,
    },
    {
      id: "notes",
      label: "Notes",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
    },
    {
      id: "tags",
      label: "Tags",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h.008v.008H6V7.5z" /></svg>`,
    },
    {
      id: "trash",
      label: "Trash",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`,
    },
  ];
</script>

<div class="w-16 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between items-center py-6 h-full shrink-0 select-none transition-colors duration-200">
  <!-- Top Logo/Icon (Vibrant Star Sparkle) -->
  <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-6 active:scale-95 transition-all duration-200">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.633a.75.75 0 010 1.298l-9.75 5.633a.75.75 0 01-.712 0L1.894 8.52a.75.75 0 010-1.298l9.75-5.633zM2.511 11.25a.75.75 0 00-.511.66v4.59a3.75 3.75 0 002.348 3.486l7.352 2.94a.75.75 0 00.56 0l7.353-2.94a3.75 3.75 0 002.348-3.485v-4.59a.75.75 0 00-.511-.66l-7.5-2.58a.75.75 0 00-.498 0l-7.5 2.58z" />
    </svg>
  </div>

  <!-- Mid Menu Icons List -->
  <div class="flex-grow flex flex-col items-center justify-start space-y-4 w-full">
    {#each menuItems as item}
      <button
        onclick={() => onchangeTab?.(item.id)}
        class="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer active:scale-95 relative group {activeTab === item.id ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'}"
        title={item.label}
      >
        <!-- Render Icon -->
        {@html item.icon}

        <!-- Subtle indicator dot -->
        {#if activeTab === item.id}
          <span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-violet-600 rounded-r-md"></span>
        {/if}

        <!-- Hover Tooltip -->
        <span class="absolute left-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] px-2 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-md">
          {item.label}
        </span>
      </button>
    {/each}
  </div>

  <!-- Bottom Settings / Profile Info -->
  <div class="flex flex-col items-center space-y-4 w-full mt-6">
    <!-- Help Button -->
    <button
      class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200 cursor-pointer"
      title="Help"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    </button>

    <!-- Settings Button -->
    <button
      class="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200 cursor-pointer"
      title="Settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.827m11.379-8.16l1.15-.827M8.14 19.333l.513-1.41m8.16-11.379l.513-1.41M12 21v-1.5m0-15V3m-3.077 5.106l.513 1.41m8.16 8.16l.513 1.41m-5.13-14.095l.513 1.41m-8.16 11.379l.513 1.41" />
      </svg>
    </button>
  </div>
</div>
