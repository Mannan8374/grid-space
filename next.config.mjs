/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tktmpecidcbunuibsxeq.supabase.co",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "avatar.vercel.sh",
        pathname: "**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
