/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Foto's van winnaars worden vanuit Supabase Storage geserveerd.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
};

export default nextConfig;
