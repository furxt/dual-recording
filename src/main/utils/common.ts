import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

// 打包时的环境 development | production | test
export const APP_ENV = __APP_ENV__

// 项目名
const projectName = 'dual-recording'
// 项目根目录
export const rootDir = is.dev ? app.getAppPath() : app.getPath('exe')
// 影像保存的路径
export const videoDir = is.dev
  ? path.join(rootDir, 'videos')
  : path.join(app.getPath('appData'), projectName, 'videos')

export const windowSizeArray: WindowSizeInfo[] = [
  {
    id: '480',
    windowWidth: 655, //1250
    windowHeight: 610,
    resolution: { width: 640, height: 480 }
  },
  {
    id: '720',
    windowWidth: 1310, // 1890
    windowHeight: 850,
    resolution: { width: 1280, height: 720 }
  }
]

export const sendError = (window, errorMsg): void => {
  window.webContents.send('catch-error', errorMsg)
}

// 在主进程 main.js 中
export const sleep = async (ms): Promise<void> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve()
      clearTimeout(timer)
    }, ms)
  })
}

export const generateErrorMsg = (error: Error): string => {
  return `
===============错误信息===============开始===================
时间: ${new Date().toISOString()}
错误信息: ${error.message}
错误名称: ${error.name}
错误堆栈:
${error.stack || '(无堆栈信息)'}
===============错误信息===============结束===================
`
}

export default {
  rootDir,
  videoDir,
  windowSizeArray,
  sendError,
  sleep,
  generateErrorMsg
}
