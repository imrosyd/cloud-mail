import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {ElementPlusResolver} from 'unplugin-vue-components/resolvers'

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), 'VITE')
    return {
        server: {
            host: true,
            port: 3001,
            hmr: true,
        },
        base: env.VITE_STATIC_URL || '/',
        plugins: [vue(),
            AutoImport({
                resolvers: [ElementPlusResolver()],
            }),
            Components({
                resolvers: [ElementPlusResolver()],
            })
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src')
            }
        },
        build: {
            target: 'es2020',
            outDir: env.VITE_OUT_DIR || 'dist',
            emptyOutDir: true,
            assetsInclude: ['**/*.json'],
            cssMinify: 'lightningcss',
            minify: 'esbuild',
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules/element-plus')) return 'vendor-ui'
                        if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'vendor-charts'
                        if (id.includes('node_modules/vue') || id.includes('node_modules/pinia') || id.includes('node_modules/vue-router') || id.includes('node_modules/vue-i18n')) return 'vendor-core'
                        if (id.includes('node_modules/axios')) return 'vendor-http'
                        if (id.includes('node_modules/dayjs')) return 'vendor-date'
                        if (id.includes('node_modules/lodash')) return 'vendor-utils'
                        if (id.includes('node_modules/dexie')) return 'vendor-db'
                        if (id.includes('node_modules/@vueuse')) return 'vendor-vueuse'
                    }
                }
            }
        }
    }
})
