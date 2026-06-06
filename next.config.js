/** @type {import('next').NextConfig} */

// Repo name for GitHub Pages subpath: https://edbedrijo.github.io/meal-prep
const repoName = 'meal-prep';
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProd ? `/${repoName}` : '',
  assetPrefix: isProd ? `/${repoName}/` : '',
  trailingSlash: true,
};

module.exports = nextConfig;
