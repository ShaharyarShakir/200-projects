<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { createDashboardState } from './dashboard.svelte.js';
	import GlowBg from '../../components/GlowBg.svelte';
	import Sidebar from '../../components/Sidebar.svelte';
	import NoteList from '../../components/NoteList.svelte';
	import Editor from '../../components/Editor.svelte';

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
					notebookId: dashboard.activeNote.notebookId
				});
			}
		}
		// Ctrl+/: Focus Search
		if ((e.ctrlKey || e.metaKey) && e.key === '/') {
			e.preventDefault();
			const input = document.querySelector('input[placeholder="Search notes..."]') as HTMLInputElement;
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

<div class="relative flex h-[calc(100vh-65px)] flex-col overflow-hidden bg-slate-950 text-slate-100">
	<!-- Ambient Glow BG -->
	<GlowBg />

	<div class="relative z-10 flex h-full flex-grow">
		<!-- 1. Left Sidebar Pane (Notebook list, quick navigation) -->
		<div
			class="hidden h-full shrink-0 md:block"
			class:block={dashboard.showMobileSidebar}
			class:hidden={!dashboard.showMobileSidebar}
		>
			<Sidebar
				notebooks={dashboard.notebooks}
				currentView={dashboard.currentView}
				selectedNotebookId={dashboard.selectedNotebookId}
				onselectView={(view, id) => dashboard.selectView(view, id)}
				oncreateNotebook={(name: string, color: string, icon: string) =>
					dashboard.createNotebook(name, color, icon)}
				ondeleteNotebook={(id: string) => dashboard.deleteNotebook(id)}
			/>
		</div>

		<!-- 2. Middle Pane (Notes list matching filters, search input) -->
		<div
			class="hidden h-full shrink-0 md:block"
			class:block={dashboard.showMobileNotes}
			class:hidden={!dashboard.showMobileNotes}
		>
			<NoteList
				notes={dashboard.sortedNotes}
				selectedNoteId={dashboard.selectedNoteId}
				currentView={dashboard.currentView}
				bind:searchQuery={dashboard.searchQuery}
				onselectNote={(id: string) => {
					dashboard.selectedNoteId = id;
					dashboard.showMobileNotes = false; // Redirect list pane to editor on small screens
				}}
				oncreateNote={() => dashboard.createNote()}
				ontoggleFavorite={(id: string) => dashboard.toggleFavoriteNote(id)}
				ontogglePin={(id: string) => dashboard.togglePinNote(id)}
				onsoftDelete={(id: string) => dashboard.softDeleteNote(id)}
				onrestore={(id: string) => dashboard.restoreNote(id)}
				onpermanentDelete={(id: string) => dashboard.permanentDeleteNote(id)}
				onsearchQueryChange={(q: string) => (dashboard.searchQuery = q)}
			/>
		</div>

		<!-- 3. Right Pane (Active Rich Text Workspace & Toolbars) -->
		<div class="relative flex h-full flex-grow flex-col overflow-hidden">
			<!-- Floating Navigation Helper for Mobile Devices -->
			<div
				class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-900/60 bg-slate-950/80 p-3.5 md:hidden"
			>
				<button
					onclick={() => {
						dashboard.showMobileSidebar = !dashboard.showMobileSidebar;
						dashboard.showMobileNotes = false;
					}}
					class="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300"
				>
					{dashboard.showMobileSidebar ? 'Close Sidebar' : '📁 Notebooks'}
				</button>

				<button
					onclick={() => {
						dashboard.showMobileNotes = !dashboard.showMobileNotes;
						dashboard.showMobileSidebar = false;
					}}
					class="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300"
				>
					{dashboard.showMobileNotes ? 'Hide List' : '📝 Notes List'}
				</button>
			</div>

			<Editor
				note={dashboard.activeNote}
				notebooks={dashboard.notebooks}
				saveStatus={dashboard.saveStatus}
				onsave={(id, updates) => dashboard.saveNote(id, updates)}
			/>
		</div>
	</div>
</div>
