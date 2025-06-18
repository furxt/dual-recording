import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  console.log('mode', mode)
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        __APP_ENV__: JSON.stringify(mode)
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src')
        }
      },
      plugins: [
        vue(),
        vueDevTools(),
        tailwindcss(),
        AutoImport({
          imports: ['vue', 'pinia'],
          resolvers: [ElementPlusResolver()]
        }),
        Components({
          resolvers: [ElementPlusResolver()]
        }),
        viteCompression()
      ],
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [] // 在生产环境中移除 console debugger
      },
      css: {
        preprocessorOptions: {
          scss: {
            api: 'modern-compiler' // or 'modern'
          }
        }
      },
      build: {
        rollupOptions: {
          output: {
            chunkFileNames: () => {
              return 'assets/js/[name]-[hash].js'
            },
            // 自定义输出目录和文件名
            entryFileNames: () => {
              return 'assets/js/[name]-[hash].js'
            },
            assetFileNames: () => {
              return 'assets/[ext]/[name]-[hash].[ext]'
            },
            manualChunks(id) {
              if (id.includes('@element-plus/icons-vue')) return 'element-plus-icons'
              if (id.includes('element-plus')) return 'vendor-element-plus'
              if (id.includes('icon-park')) return 'icon-park'
              return null
            }
          }
        }
      }
    }
  }
})
