import { createClient } from "$lib/prismicio";

export const load = async () => {
    const client = createClient()
    const settings = await client.getSingle('settings')
    return {
        settings
    }
}
export const prerender = 'auto';
