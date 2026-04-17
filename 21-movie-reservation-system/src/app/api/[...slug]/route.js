// src/app/api/[...slug]/route.js
// Catch-all de Next.js App Router que delega todas las peticiones /api/* a Express

import app from '../../../app.js'

// Adaptador entre el fetch API de Next.js y Express
function toNodeRequest(request, url) {
  const headers = {}
  request.headers.forEach((value, key) => { headers[key] = value })

  return {
    method: request.method,
    url: url.pathname + (url.search || ''),
    headers,
    body: request.body,
    // Helpers que Express espera
    get: (name) => headers[name.toLowerCase()],
    socket: { remoteAddress: '127.0.0.1' },
  }
}

async function handleRequest(request) {
  const url = new URL(request.url)

  return new Promise((resolve) => {
    const nodeReq = toNodeRequest(request, url)
    const chunks = []

    const nodeRes = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) { this.headers[key] = value },
      getHeader(key) { return this.headers[key] },
      removeHeader(key) { delete this.headers[key] },
      end(body) {
        const responseHeaders = new Headers()
        Object.entries(this.headers).forEach(([k, v]) => responseHeaders.set(k, String(v)))
        if (!responseHeaders.has('content-type')) {
          responseHeaders.set('content-type', 'application/json')
        }
        resolve(new Response(body || '', { status: this.statusCode, headers: responseHeaders }))
      },
      write(chunk) { chunks.push(chunk) },
      json(data) {
        this.setHeader('content-type', 'application/json')
        this.end(JSON.stringify(data))
      },
      status(code) { this.statusCode = code; return this },
      send(data) { this.end(typeof data === 'string' ? data : JSON.stringify(data)) },
    }

    // Parsear body JSON
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      request.json()
        .then(body => {
          nodeReq.body = body
          app(nodeReq, nodeRes)
        })
        .catch(() => {
          nodeReq.body = {}
          app(nodeReq, nodeRes)
        })
    } else {
      app(nodeReq, nodeRes)
    }
  })
}

export async function GET(request)    { return handleRequest(request) }
export async function POST(request)   { return handleRequest(request) }
export async function PUT(request)    { return handleRequest(request) }
export async function PATCH(request)  { return handleRequest(request) }
export async function DELETE(request) { return handleRequest(request) }
export async function OPTIONS(request){ return handleRequest(request) }
