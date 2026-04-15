// src/lib/express-handler.js
// Bridge entre Next.js App Router y la app Express.
// Permite usar los route handlers de Next como delegadores a Express.
import app from '../server/app.js'

/**
 * Crea un handler de Next.js App Router que delega la request a Express.
 * Soporta GET, POST, PUT, PATCH, DELETE.
 */
export function createHandler() {
  const handler = async (request, context) => {
    return new Promise((resolve, reject) => {
      // Construimos un objeto req compatible con Express a partir de la Web Request
      const url = new URL(request.url)

      const req = {
        method: request.method,
        url: url.pathname + url.search,
        path: url.pathname,
        query: Object.fromEntries(url.searchParams.entries()),
        headers: Object.fromEntries(request.headers.entries()),
        params: context?.params ?? {},
        body: null,
      }

      // Leemos el body si existe
      const contentType = request.headers.get('content-type') ?? ''
      const bodyPromise = contentType.includes('application/json')
        ? request.json().catch(() => null)
        : Promise.resolve(null)

      bodyPromise.then((body) => {
        req.body = body

        const chunks = []
        const res = {
          statusCode: 200,
          headers: {},
          status(code) {
            this.statusCode = code
            return this
          },
          setHeader(key, value) {
            this.headers[key] = value
            return this
          },
          json(data) {
            resolve(
              new Response(JSON.stringify(data), {
                status: this.statusCode,
                headers: { 'Content-Type': 'application/json', ...this.headers },
              })
            )
          },
          send(data) {
            resolve(
              new Response(typeof data === 'string' ? data : JSON.stringify(data), {
                status: this.statusCode,
                headers: { 'Content-Type': 'application/json', ...this.headers },
              })
            )
          },
          end() {
            resolve(new Response(null, { status: this.statusCode, headers: this.headers }))
          },
        }

        // Dispatch a Express
        app(req, res, (err) => {
          if (err) reject(err)
          else resolve(new Response(null, { status: 404 }))
        })
      })
    })
  }

  return handler
}

export const GET = createHandler()
export const POST = createHandler()
export const PUT = createHandler()
export const PATCH = createHandler()
export const DELETE = createHandler()
