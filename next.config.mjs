/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      '/api/**/*': ['./data/**/*'],
    },
    serverComponentsExternalPackages: ['xlsx', 'mammoth', 'pdf-parse'],
  },
};

export default nextConfig;
