/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['hlqyyeufimgzhcrleyax.supabase.co'],

  },
};

module.exports = nextConfig;
