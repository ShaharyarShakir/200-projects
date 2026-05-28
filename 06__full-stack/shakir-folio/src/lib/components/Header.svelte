<script lang="ts">
	import { isFilled, type Content } from '@prismicio/client';
	import NavBarLink from './NavBarLink.svelte';
	import Button from './Button.svelte';
	import IconMenu from '~icons/ic/outline-menu';
	import IconClose from '~icons/ic/sharp-close';
	export let settings: Content.SettingsDocument;
	let open = false;
	const onLinkClick = () => {
		open = false;
	};
</script>

<header class="top-0 z-50 mx-auto max-w-7xl md:sticky md:top-4 relative">
	<nav>
		<div
			class="flex flex-col justify-between rounded-b-lg bg-slate-50 px-4 py-2 md:m-4 md:flex-row md:items-center md:rounded-xl"
		>
			<div class="flex items-center justify-between">
				<a
					href="/"
					aria-label="homepage"
					class="text-xl font-extrabold text-slate-900 tracking-tighter">{settings.data.name}</a
				>
				<button
					aria-expanded={open}
					aria-label="Open Menu"
					onclick={() => (open = true)}
					class="block md:hidden text-slate-800 text-2xl p-2 cursor-pointer"
				>
					<IconMenu />
				</button>
			</div>
			<!-- Mobile NavBar -->
			<ul
				class={`fixed inset-0 z-50 flex flex-col items-end gap-4 bg-slate-50 pr-4 pt-14
			 transition-transform duration-500 ease-in-out md:hidden ${open ? 'translate-x-0' : 'translate-x-[100%]'}`}
			>
				<li>
					<button
						aria-expanded={open}
						aria-label="Open Menu"
						onclick={() => (open = false)}
						class="fixed right-4 top-3 block p-2 text-2xl text-slate-800 cursor-pointer"
					>
						<IconClose />
					</button>
				</li>
				{#each settings.data.nav_items as { label, link }}
					<li class="first:mt-8 text-slate-900">
						<NavBarLink field={link} {label} type="mobile" {onLinkClick} />
					</li>
				{/each}
				{#if isFilled.link(settings.data.cta_link)}
					<Button linkField={settings.data.cta_link} label={settings.data.cta_label} class="ml-3" />
				{/if}
			</ul>
			<!-- Desktop NavBar -->
			<ul class="relative hidden z-50 flex-row items-center gap-1 bg-transparent py-0 md:flex">
				{#each settings.data.nav_items as { label, link }}
					<li>
						<NavBarLink field={link} {label} type="desktop" {onLinkClick} />
					</li>
				{/each}
				{#if isFilled.link(settings.data.cta_link)}
					<Button linkField={settings.data.cta_link} label={settings.data.cta_label} class="ml-3" />
				{/if}
			</ul>
		</div>
	</nav>
</header>
