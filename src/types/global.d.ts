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
  // 编译环节时全局的环境变量
  const __APP_ENV__: 'production' | 'development' | 'test'
}

export {}
