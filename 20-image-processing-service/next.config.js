/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable the built-in server since we use a custom Express server
  // The custom server in server.js handles routing
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@prisma/client'],
  },
}

export default nextConfig
