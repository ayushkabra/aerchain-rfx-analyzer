/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'mammoth', 'pdf-parse'],
  },
};

export default nextConfig;
