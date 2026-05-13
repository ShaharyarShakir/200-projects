import { getCollection, type CollectionEntry } from "astro:content";

export const BLOG_COLLECTIONS = ["blog", "devops", "fullstack", "mlops", "mobile", "series"] as const;
export type BlogCollectionName = (typeof BLOG_COLLECTIONS)[number];
export type BlogEntry = CollectionEntry<BlogCollectionName>;

export async function getAllBlogPosts(includeDrafts: boolean): Promise<BlogEntry[]> {
  const collections = await Promise.all(
    BLOG_COLLECTIONS.map((collectionName) =>
      getCollection(collectionName, ({ data }) => (includeDrafts ? true : !data.draft)),
    ),
  );

  return collections.flat();
}
