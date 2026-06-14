import { getPosts } from "$lib/posts/get-post";
import { json } from "@sveltejs/kit";



export const GET = async () => {
    const posts = await getPosts()
    return json(posts)
};