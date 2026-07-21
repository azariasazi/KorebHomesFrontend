/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets Next.js compile the shared workspace packages instead of expecting
  // them pre-built — important since @koreb/* packages ship raw TypeScript.
  transpilePackages: [
    '@koreb/api-client',
    '@koreb/design-tokens',
    '@koreb/i18n',
    '@koreb/types',
  ],
  images: {
    remotePatterns: [
      // Dev backend serves uploaded photos from /uploads on the API host.
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/uploads/**' },
    ],
  },
};

module.exports = nextConfig;
