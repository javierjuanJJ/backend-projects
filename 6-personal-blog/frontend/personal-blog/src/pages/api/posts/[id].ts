export const prerender = false
// src/pages/api/posts/[id].ts
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.resolve('./src/posts');

function postPath(id: string) {
  return path.join(POSTS_DIR, `${id}.md`);
}

// GET /api/posts/:id — single post with raw content
export const GET: APIRoute = async ({ params }) => {
  try {
    const raw = await fs.readFile(postPath(params.id!), 'utf8');
    const { data, content } = matter(raw);
    return new Response(
      JSON.stringify({ id: params.id, frontmatter: data, content, raw }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), { status: 404 });
  }
};

// PUT /api/posts/:id — update post
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { title, date, description, tags = [], content = '' } = body;
    const updated = matter.stringify(content, { title, date, description, tags });
    await fs.writeFile(postPath(params.id!), updated, 'utf8');
    return new Response(
      JSON.stringify({ id: params.id, message: 'Post actualizado correctamente' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// DELETE /api/posts/:id — delete post
export const DELETE: APIRoute = async ({ params }) => {
  try {
    await fs.unlink(postPath(params.id!));
    return new Response(
      JSON.stringify({ message: 'Post eliminado correctamente' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(JSON.stringify({ error: 'Post no encontrado' }), { status: 404 });
  }
};
