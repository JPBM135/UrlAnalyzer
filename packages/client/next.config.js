// eslint-disable-next-line tsdoc/syntax
/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	experimental: {
		appDir: true,
		runtime: 'edge',
	},
	images: {
		domains: ['i.imgur.com'],
	},
};

module.exports = nextConfig;
