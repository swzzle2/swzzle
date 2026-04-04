import fs from 'fs';
import path from 'path';

export type Post = {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  body: string;
  status: 'draft' | 'published';
  date: string;
  excerpt: string;
};

const POSTS_PATH = path.join(process.cwd(), 'data', 'posts.json');

export function getPosts(): Post[] {
  const data = fs.readFileSync(POSTS_PATH, 'utf-8');
  return JSON.parse(data) as Post[];
}

export function getPublishedPosts(): Post[] {
  return getPosts().filter((p) => p.status === 'published');
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

export function savePosts(posts: Post[]): void {
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
}
