// src/pages/api/posts/index.ts
export const prerender = false

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const POSTS_DIR = path.resolve('./src/posts');

async function ensureDir() {
  await fs.mkdir(POSTS_DIR, { recursive: true });
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// GET /api/posts — list all posts (frontmatter only)
export const GET: APIRoute = async () => {
  await ensureDir();
  try {
    const files = await fs.readdir(POSTS_DIR);
    const posts = await Promise.all(
      files
        .filter(f => f.endsWith('.md'))
        .map(async file => {
          const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
          const { data } = matter(raw);
          return {
            id: file.replace('.md', ''),
            title: data.title ?? 'Sin título',
            date: data.date ?? null,
            description: data.description ?? '',
            tags: data.tags ?? [],
          };
        })
    );
    posts.sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime());
    return new Response(JSON.stringify(posts), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// POST /api/posts — create new post
export const POST: APIRoute = async ({ request }) => {
  await ensureDir();
  try {
    const body = await request.json();
    const { title, date, description, tags = [], content = '' } = body;
    if (!title) {
      return new Response(JSON.stringify({ error: 'El título es obligatorio' }), { status: 400 });
    }

    const id = slugify(title);
    const filePath = path.join(POSTS_DIR, `${id}.md`);

    // Prevent overwrite
    try {
      await fs.access(filePath);
      return new Response(JSON.stringify({ error: 'Ya existe un post con ese slug' }), { status: 409 });
    } catch {}

    const fileContent = matter.stringify(content, {
      title,
      date: date || new Date().toISOString().split('T')[0],
      description,
      tags,
    });
    await fs.writeFile(filePath, fileContent, 'utf8');
    return new Response(JSON.stringify({ id, message: 'Post creado correctamente' }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
