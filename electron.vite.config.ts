import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import htmlMinifier from 'vite-plugin-html-minifier'

export default defineConfig(({ mode }) => {
  console.log('mode', mode)
  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        __APP_ENV__: JSON.stringify(mode)
      },
      esbuild: {
        drop: mode !== 'development' ? ['console', 'debugger'] : [] // 在生产环境中移除 console debugger
      },
      build: {
        rollupOptions: {
          output: {
            exports: 'named' // 解决警告
          }
        }
      },
      resolve: {
        alias: {
          '@main': resolve('src/main'),
          '@common': resolve('src/common')
        }
      }
    },
    preload: {
      plugins: [externalizeDepsPlugin()] //mode === 'development' ? undefined : bytecodePlugin() 字节码加密
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@common': resolve('src/common')
        }
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `@use "@renderer/styles/element/variables.scss" as *;`
          }
        }
      },
      plugins: [
        vue(),
        vueDevTools(),
        AutoImport({
          imports: ['vue', 'pinia'],
          resolvers: [ElementPlusResolver({ importStyle: 'sass' })]
        }),
        Components({
          resolvers: [ElementPlusResolver({ importStyle: 'sass' })]
        }),
        tailwindcss(),
        htmlMinifier({ minify: mode !== 'development' })
      ],
      esbuild: {
        drop: mode !== 'development' ? ['console', 'debugger'] : [] // 在生产环境中移除 console debugger
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
