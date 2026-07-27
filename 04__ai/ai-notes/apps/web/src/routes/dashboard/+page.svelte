<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createDashboardState } from './dashboard.svelte.js';
	import IconBar from '../../components/IconBar.svelte';
	import Sidebar from '../../components/Sidebar.svelte';
	import Editor from '../../components/Editor.svelte';
	import Assistant from '../../components/Assistant.svelte';

	let { data } = $props();
	let user = $derived(data.user);

	// Initialize the modular dashboard state
	const dashboard = createDashboardState();

	// --- HANDLERS ---
	function handleKeyboardShortcuts(e: KeyboardEvent) {
		// Ctrl+N: New Note
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
			e.preventDefault();
			dashboard.createNote();
		}
		// Ctrl+S: Force Save (we already auto-save, but nice to support)
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			if (dashboard.activeNote) {
				dashboard.saveNote(dashboard.activeNote.id, {
					title: dashboard.activeNote.title,
					content: dashboard.activeNote.content,
					notebookId: dashboard.activeNote.notebookId,
					summary: dashboard.activeNote.summary
				});
			}
		}
		// Ctrl+/: Focus Search
		if ((e.ctrlKey || e.metaKey) && e.key === '/') {
			e.preventDefault();
			const input = document.querySelector(
				'input[placeholder="Search notes or projects..."]'
			) as HTMLInputElement;
			if (input) input.focus();
		}
		// Ctrl+P: Toggle Pin
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
			if (dashboard.activeNote) {
				e.preventDefault();
				dashboard.togglePinNote(dashboard.activeNote.id);
			}
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyboardShortcuts);
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('keydown', handleKeyboardShortcuts);
		}
	});
</script>

<div class="relative flex h-[calc(100vh-65px)] flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
	<div class="relative z-10 flex h-full flex-grow">
		<!-- 1. Far Left Pane: Icon Bar (64px) -->
		<IconBar activeTab="notes" />

		<!-- 2. Middle Left Pane: Sidebar (Redesigned with embedded lists) -->
		<div
			class="hidden h-full shrink-0 md:block"
			class:block={dashboard.showMobileSidebar}
			class:hidden={!dashboard.showMobileSidebar}
		>
			<Sidebar
				notebooks={dashboard.notebooks}
				notes={dashboard.sortedNotes}
				selectedNotebookId={dashboard.selectedNotebookId}
				selectedNoteId={dashboard.selectedNoteId}
				currentView={dashboard.currentView}
				bind:searchQuery={dashboard.searchQuery}
				onselectView={(view: "all" | "favorites" | "trash" | "notebook", id: string | null) => dashboard.selectView(view, id)}
				onselectNote={(id: string) => (dashboard.selectedNoteId = id)}
				oncreateNote={() => dashboard.createNote()}
				oncreateNotebook={(name: string, color: string, icon: string) => dashboard.createNotebook(name, color, icon)}
				ondeleteNotebook={(id: string) => dashboard.deleteNotebook(id)}
				ontoggleFavorite={(id: string) => dashboard.toggleFavoriteNote(id)}
				ontogglePin={(id: string) => dashboard.togglePinNote(id)}
				onsoftDelete={(id: string) => dashboard.softDeleteNote(id)}
			/>
		</div>

		<!-- 3. Active Rich Text Document Workspace -->
		<div class="relative flex h-full flex-grow flex-col overflow-hidden">
			<!-- Floating Navigation Helper for Mobile Devices -->
			<div
				class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3.5 md:hidden transition-colors"
			>
				<button
					onclick={() => {
						dashboard.showMobileSidebar = !dashboard.showMobileSidebar;
						dashboard.showMobileNotes = false;
					}}
					class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-655 dark:text-slate-350"
				>
					{dashboard.showMobileSidebar ? 'Close Sidebar' : '📁 Notebooks'}
				</button>

				<button
					onclick={() => {
						dashboard.showMobileNotes = !dashboard.showMobileNotes;
						dashboard.showMobileSidebar = false;
					}}
					class="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-655 dark:text-slate-350"
				>
					{dashboard.showMobileNotes ? 'Close List' : '📝 Notes List'}
				</button>
			</div>

			<Editor
				note={dashboard.activeNote}
				notebooks={dashboard.notebooks}
				saveStatus={dashboard.saveStatus}
				onsave={(id, updates) => dashboard.saveNote(id, updates)}
			/>
		</div>

		<!-- 4. Far Right Pane: AI Assistant Panel -->
		<Assistant
			activeNoteTitle={dashboard.activeNote?.title || ''}
			activeNoteContent={dashboard.activeNote ? JSON.stringify(dashboard.activeNote.content) : ''}
		/>
	</div>
</div>
