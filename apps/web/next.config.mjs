/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@buildev/ai',
    '@buildev/editor-core',
    '@buildev/exporters',
    '@buildev/scene-graph',
    '@buildev/shared',
    '@buildev/ui',
    '@buildev/vision'
  ],
  images: {
    unoptimized: true
  }
};

export default nextConfig;
