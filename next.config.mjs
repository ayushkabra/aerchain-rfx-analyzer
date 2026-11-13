/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    '/api/**/*': ['./data/**/*'],
  },
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'mammoth', 'pdf-parse'],
  },
};

export default nextConfig;
