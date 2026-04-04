import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getPosts, savePosts, type Post } from '@/lib/posts';

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get('id');
  const posts = getPosts();

  if (id) {
    const post = posts.find((p) => p.id === id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  }

  return NextResponse.json(posts);
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const posts = getPosts();

    const excerpt = data.body
      ? data.body.replace(/[#*_`\[\]]/g, '').slice(0, 150).trim() + '...'
      : '';

    if (data.id) {
      // Update existing post
      const index = posts.findIndex((p) => p.id === data.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      posts[index] = {
        ...posts[index],
        ...data,
        excerpt,
      };
      savePosts(posts);
      return NextResponse.json({ success: true, post: posts[index] });
    } else {
      // Create new post
      const newPost: Post = {
        id: crypto.randomUUID(),
        title: data.title || 'Untitled',
        slug: data.slug || 'untitled',
        tags: data.tags || [],
        body: data.body || '',
        status: data.status || 'draft',
        date: data.date || new Date().toISOString().split('T')[0],
        excerpt,
      };
      posts.unshift(newPost);
      savePosts(posts);
      return NextResponse.json({ success: true, post: newPost });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
