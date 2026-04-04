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
