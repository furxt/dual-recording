import { join } from 'path'
import { createReadStream } from 'fs'
import { createHash } from 'crypto'
import { sendApp } from './send'
import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { CATCH_ERROR } from '@constants/index'
import { Readable } from 'stream'

// 打包时的环境 development | production | test
export const APP_ENV = __APP_ENV__

// 项目名
const projectName = 'dual-recording'
// 项目根目录
export const rootDir = is.dev ? app.getAppPath() : app.getPath('exe')
// 影像保存的路径
export const videoDir = is.dev
  ? join(rootDir, 'videos')
  : join(app.getPath('appData'), projectName, 'videos')

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

export const sendError = (window: BrowserWindow, errorMsg: string): void => {
  sendApp(window, CATCH_ERROR, errorMsg)
}

// 在主进程 main.js 中
export const sleep = async (ms: number): Promise<void> => {
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

/**
 * 计算单个 chunk 的 MD5
 * @param {string} filePath
 * @param {number} offset
 * @param {number} size
 * @returns {Promise<string>}
 */
export const getChunkMD5 = (
  flag: boolean,
  filePath: string,
  offset: number,
  size: number
): Promise<FileHashResult> => {
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = []
    const hash = createHash('md5')
    const stream = createReadStream(filePath, {
      start: offset,
      end: offset + size - 1 // 注意：end 是闭区间，所以要减一
    })

    stream.on('data', (chunk) => {
      hash.update(chunk)
      if (flag) {
        buffers.push(Buffer.from(chunk)) // 显式拷贝一份
      }
    })

    stream.on('end', () => {
      const result: FileHashResult = {
        md5: hash.digest('hex'),
        buffer: flag ? Buffer.concat(buffers) : undefined
      }
      resolve(result)
    })

    stream.on('error', (err) => {
      reject(new Error(`读取文件分片失败: ${err.message}`))
    })
  })
}

export const bufferToStream = (buffer: Buffer): Readable => {
  const readable = new Readable()
  readable._read = () => {} // 必须实现，但不需要做任何事
  readable.push(buffer) // 推入数据
  readable.push(null) // 结束流
  return readable
}

export default {
  rootDir,
  videoDir,
  windowSizeArray,
  sendError,
  sleep,
  generateErrorMsg,
  getChunkMD5,
  bufferToStream,
  APP_ENV
}
