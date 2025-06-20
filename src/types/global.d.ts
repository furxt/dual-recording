// src/types/global.d.ts

// 声明全局常量变量 __APP_ENV__

declare global {
  interface WindowSizeInfo {
    id: string
    windowWidth: number
    windowHeight: number
    resolution: {
      width: number
      height: number
    }
  }
  interface Result<T> {
    success: boolean
    message?: string
    data?: T
    error?: string
  }
  interface FileHashResult {
    md5: string // hash.digest('hex') 返回十六进制字符串
    buffer: Buffer // Buffer.concat 返回新的 Buffer 实例
  }
  // 编译环节时全局的环境变量
  const __APP_ENV__: 'production' | 'development' | 'test'
}

export {}
