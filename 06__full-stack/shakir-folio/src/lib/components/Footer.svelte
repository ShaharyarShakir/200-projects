<script lang="ts">
	import { type Content, isFilled } from '@prismicio/client';
	import { PrismicLink } from '@prismicio/svelte';
	import IconGithub from '~icons/fa6-brands/github';
	import IconLinkedin from '~icons/fa6-brands/linkedin';
	import IconXTwitter from '~icons/fa6-brands/x-twitter';
	import Bounded from './Bounded.svelte';
	export let settings: Content.SettingsDocument;
</script>

<Bounded as="footer" class="text-slate-600">
	<div class="container mx-auto flex flex-col items-center justify-between gap-6 py-8 sm:flex-row">
		<div
			class="flex flex-col items-center justify-center gap-x-4 gap-y-2 sm:flex-row sm:justify-self-start"
		>
			<a
				href="/"
				class="text-xl font-extrabold tracking-tighter text-slate-100 transition-colors duration-150 hover:text-yellow-500"
				>{settings.data.name}</a
			>
			<span
				class="hidden font-extralight text-5xl text-slate-400 leading-[0] sm:inline"
				aria-hidden="true">/</span
			>
			<p>©{new Date().getFullYear()} {settings.data.name}</p>
		</div>
		<nav class="navigation" aria-label="footer-navigation">
			<ul class="flex items-center gap-1">
				{#each settings.data.nav_items as { link, label }, index}
					<li>
						<PrismicLink
							field={link}
							class="block px-3 py-1 text-base font-bold text-slate-200 transition-colors duration-150 hover:text-yellow-500"
							>{label}</PrismicLink
						>
					</li>
					{#if index < settings.data.nav_items.length - 1}
						<span
							class="hidden font-extralight text-5xl text-slate-400 leading-[0] sm:inline"
							aria-hidden="true">/</span
						>
					{/if}
				{/each}
			</ul>
		</nav>
		<div class="socials text-slate-200 inline-flex justify-center sm:justify-start">
			{#if isFilled.link(settings.data.github_link)}
				<PrismicLink
					field={settings.data.github_link}
					class="p-2 text-2xl text-slate-200 transform transition-all duration-150 hover:scale-125 hover:text-yellow-500"
					aria-label={settings.data.name + ' on Github'}><IconGithub /></PrismicLink
				>
			{/if}
			{#if isFilled.link(settings.data.linklden_link)}
				<PrismicLink
					field={settings.data.linklden_link}
					class="p-2 text-2xl text-slate-200 transform transition-all duration-150 hover:scale-125 hover:text-yellow-500"
					aria-label={settings.data.name + ' on linkedin'}><IconLinkedin /></PrismicLink
				>
			{/if}
			{#if isFilled.link(settings.data.twitter_link)}
				<PrismicLink
					field={settings.data.twitter_link}
					class="p-2 text-2xl text-slate-200 transform transition-all duration-150 hover:scale-125 hover:text-yellow-500"
					aria-label={settings.data.name + ' on Twitter'}><IconXTwitter /></PrismicLink
				>
			{/if}
		</div>
	</div>
</Bounded>
