import { defineConfig } from 'vite'
import { resolve, join } from 'path'
import { createVuePlugin } from 'vite-plugin-vue2'
import { VitePWA } from 'vite-plugin-pwa'

const isNightly = process.argv[2] === '--nightly'
const iconPath = (filePath: string) =>
	isNightly ? `./img/icons/nightly/${filePath}` : `./img/icons/${filePath}`

// https://vitejs.dev/config/
export default defineConfig({
	base: '/',
	server: {
		port: 8080,
	},
	resolve: {
		alias: {
			'/@': join(__dirname, 'src'),
			vue: 'vue/dist/vue.esm.js',
			molangjs: join(__dirname, './src/utils/MoLangJS.ts'),
		},
	},
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				// nested: resolve(__dirname, 'nested/index.html'),
			},
		},
	},
	plugins: [
		createVuePlugin(),
		VitePWA({
			filename: 'service-worker.js',
			registerType: 'prompt',
			includeAssets: [
				iconPath('favicon.svg'),
				iconPath('favicon-16x16.png'),
				iconPath('favicon-32x32.png'),
			],
			workbox: {
				maximumFileSizeToCacheInBytes: Number.MAX_SAFE_INTEGER,
			},
			manifest: {
				name: isNightly ? 'bridge Nightly' : 'bridge v2',
				short_name: isNightly ? 'bridge Nightly' : 'bridge v2',
				theme_color: '#1778D2',
				icons: [
					{
						src: iconPath('android-chrome-192x192.png'),
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: iconPath('android-chrome-512x512.png'),
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: iconPath('android-chrome-maskable-192x192.png'),
						sizes: '192x192',
						type: 'image/png',
						purpose: 'maskable',
					},
					{
						src: iconPath('android-chrome-maskable-512x512.png'),
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
				start_url: '.',
				display: 'standalone',
				background_color: '#0F0F0F',
				// @ts-ignore
				capture_links: ['existing-client-navigate'],
				file_handlers: [
					{
						action: '/',
						accept: {
							'application/zip': [
								'.mcaddon',
								'.mcpack',
								'.mcworld',
								'.mctemplate',
							],
							'application/json': ['.json', '.bbmodel'],
							'application/javascript': ['.js', '.ts'],
							'text/plain': ['.mcfunction', '.molang', '.lang'],
							'image/*': ['.tga', '.png', '.jpg', '.jpeg'],
						},
					},
				],
				display_override: ['window-controls-overlay', 'standalone'],
			},
		}),
	],
})
