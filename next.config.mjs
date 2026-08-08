/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Foto's van winnaars worden vanuit Supabase Storage geserveerd.
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }],
  },
  experimental: {
    // Meerdere foto's tegelijk uploaden past niet in de standaard 1 MB.
    // De browser verkleint ze al (FotoKiezer); dit is de bovengrens.
    // Hoger dan 4 MB heeft geen zin: dat weigert Vercel zelf.
    serverActions: { bodySizeLimit: '4mb' },
  },
};

export default nextConfig;
