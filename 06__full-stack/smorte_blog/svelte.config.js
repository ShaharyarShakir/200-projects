import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { escapeSvelte } from 'mdsvex'
import { mdsvex } from 'mdsvex'
import { createHighlighter } from 'shiki'

/** @type {import('mdsvex').MdsvexOptions} */
const mdsvexOptions = {
	extensions: ['.md', '.mdx'],
	layout:{
		_: new URL('./src/mdsvex.svelte', import.meta.url).pathname
	},
	highlight: {
		highlighter: async (code, lang = 'text') => {
			const highlighter = await createHighlighter({
				themes: ['poimandres'],
				langs: ['javascript', 'typescript', 'python', 'bash', 'css', 'html', 'json']

			})
			await highlighter.loadLanguage('javascript', 'typescript', 'python', 'bash', 'css', 'html', 'json')
			const html = escapeSvelte(highlighter.codeToHtml(code, { lang, theme: 'poimandres'	 }))
			return `{@html \`${html}\`}`

		}
	}
	
}
/** @type {import('@sveltejs/kit').Config} */

const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
	kit: {
		adapter: adapter()
	}
}

export default config
