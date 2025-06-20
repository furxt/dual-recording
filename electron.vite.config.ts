import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import viteCompression from 'vite-plugin-compression'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ mode }) => {
  console.log('mode', mode)
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        __APP_ENV__: JSON.stringify(mode)
      },
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [] // 在生产环境中移除 console debugger
      },
      build: {
        rollupOptions: {
          output: {
            exports: 'named' // 👈 关键配置，解决警告
          }
        }
      },
      resolve: {
        alias: {
          '@main': resolve('src/main'),
          '@constants': resolve('src/constants')
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@constants': resolve('src/constants')
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
            chunkFileNames: 'assets/js/[name]-[hash].js',
            // 自定义输出目录和文件名
            entryFileNames: 'assets/js/[name]-[hash].js',
            assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
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
