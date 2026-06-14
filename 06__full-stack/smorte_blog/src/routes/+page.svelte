<script lang="ts">
	import {formatDate} from '$lib/utils/format-date'
	import welcomeFallback from '$lib/images/svelte-welcome.png'
	import welcome from '$lib/images/svelte-welcome.webp'
	import * as config from '$lib/config.js'
	export let data
</script>

<svelte:head>
	<title>{config.title}</title>
	<meta name="description" content={config.description} />

</svelte:head>

<section>
	<h1>
		<span class="welcome">
			<picture>
				<source srcset={welcome} type="image/webp" />
				<img src={welcomeFallback} alt="Welcome" />
			</picture>
		</span>
	</h1>
	<ul class="posts">
		{#each data.posts as post (post.slug)}
		<li class="post">
			<a href={post.slug} class="title">{post.title}</a>
			<p class="date">{formatDate(post.date)}</p>
			<p class="description">{post.description}</p>
		</li>
{/each}
	</ul>
</section>

<style>
	.posts {
		display: grid;
		gap: var(--size-7);

		.post {
			max-inline-size: var(--size-content-3);

			&:not(:last-child) {
				border-bottom: 1px solid var(--border);
				padding-bottom: var(--size-7);
			}

			.title {
				font-size: var(--font-size-fluid-3);
				text-transform: capitalize;
			}

			.date {
				color: var(--text-2);
			}

			.description {
				margin-top: var(--size-3);
			}
		}
	}
</style>