// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite importar paquetes de Node.js en API routes
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  // Desactiva el prefetch de rutas estáticas en producción para esta API pura
  trailingSlash: false,
}

export default nextConfig
