/**
 * @file docs/swagger.js
 * @description OpenAPI 3.0 documentation setup via swagger-jsdoc + swagger-ui-express.
 * Served at GET /api/docs
 */
import swaggerJsdoc  from 'swagger-jsdoc'
import swaggerUi     from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'Image Processing API',
      version:     '1.0.0',
      description: `
REST API for image upload, transformation and retrieval.

Built with **Next.js + Express**, **Prisma**, **Sharp** and **RabbitMQ**.

### Authentication
All protected endpoints require a **Bearer JWT** in the \`Authorization\` header:
\`\`\`
Authorization: Bearer <token>
\`\`\`
Obtain a token via \`POST /api/register\` or \`POST /api/login\`.

### Image Transformations
Transformations are processed **asynchronously** via RabbitMQ.
The \`POST /api/images/:id/transform\` endpoint returns \`202 Accepted\` immediately
with a \`transformId\`. Poll \`GET /api/images/:id\` to see the result under \`transformations[]\`.
      `,
      contact: {
        name:  'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url:  'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' },
      { url: 'https://api.yourdomain.com', description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        TransformPayload: {
          type:     'object',
          required: ['transformations'],
          properties: {
            transformations: {
              type: 'object',
              properties: {
                resize:    { type: 'object', properties: { width: { type: 'integer' }, height: { type: 'integer' } } },
                crop:      { type: 'object', properties: { width: { type: 'integer' }, height: { type: 'integer' }, x: { type: 'integer' }, y: { type: 'integer' } } },
                rotate:    { type: 'number', minimum: 0, maximum: 360 },
                flip:      { type: 'boolean' },
                mirror:    { type: 'boolean' },
                compress:  { type: 'integer', minimum: 1, maximum: 100 },
                format:    { type: 'string', enum: ['jpeg', 'png', 'webp', 'avif', 'tiff'] },
                filters:   { type: 'object', properties: { grayscale: { type: 'boolean' }, sepia: { type: 'boolean' } } },
                watermark: { type: 'object', properties: { text: { type: 'string' }, opacity: { type: 'number', minimum: 0, maximum: 1 } } },
              },
            },
          },
          example: {
            transformations: {
              resize:  { width: 800, height: 600 },
              format:  'webp',
              compress: 85,
              filters: { grayscale: false },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error:   { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      { name: 'System',   description: 'Health and status endpoints' },
      { name: 'Auth',     description: 'Registration and authentication' },
      { name: 'Images',   description: 'Image upload, retrieval and transformation' },
      { name: 'Products', description: 'Product catalogue' },
      { name: 'Cart',     description: 'Shopping cart management' },
    ],
  },
  apis: ['./src/server/controllers/*.js', './src/server/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

/**
 * Mount Swagger UI on the Express app.
 * @param {import('express').Application} app
 */
export function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Image API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1a1a2e; }',
  }))

  // Also expose the raw JSON spec
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))
}
