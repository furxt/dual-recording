import { app } from 'electron'
import path from 'path'
import { is } from '@electron-toolkit/utils'

/* global __APP_ENV__:readonly */
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

export const windowSizeArray = [
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

export const sendError = (window, errorMsg) => {
  if (is.dev) window.webContents.send('catch-error', errorMsg)
}

// 在主进程 main.js 中
export const sleep = async (ms) => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(true)
      clearTimeout(timer)
    }, ms)
  })
}

export default {
  rootDir,
  videoDir,
  windowSizeArray,
  sendError,
  sleep
}
