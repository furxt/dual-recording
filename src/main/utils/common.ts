import { join } from 'path'
import { createReadStream } from 'fs'
import { sendApp } from './send'
import { is } from '@electron-toolkit/utils'
import { app, BrowserWindow } from 'electron'
import { CATCH_ERROR } from '@common/constants'
import { logger } from './logger'
import SparkMD5 from 'spark-md5'

// 打包时的环境 development | production | test
export const APP_ENV = __APP_ENV__

// 应用名
const projectName = 'dual-recording'
// 应用根目录
export const rootDir = is.dev ? app.getAppPath() : app.getPath('exe')
// 用户数据目录
const appData = app.getPath('appData')
// 影像保存的路径
export const videoDir = is.dev ? join(rootDir, 'videos') : join(appData, projectName, 'videos')

export const windowSizeArray: WindowSizeInfo[] = [
  {
    id: '480',
    windowWidth: 655, //1250
    windowHeight: 580,
    resolution: { width: 640, height: 480 }
  },
  {
    id: '720',
    windowWidth: 1310, // 1890
    windowHeight: 820,
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

export const getFileMD5 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const stream = createReadStream(filePath, { highWaterMark: 1024 * 1024 }) // 每次读取1MB

    stream.on('data', (chunk) => {
      spark.append((chunk as Buffer).buffer as ArrayBuffer)
    })

    stream.on('end', () => {
      const hash = spark.end()
      logger.debug(`File MD5: ${hash}`)
      resolve(hash) // 返回 hash
    })

    stream.on('error', (err) => {
      logger.error(`Error while reading the file: ${err.message}`)
      reject(err)
    })
  })
}

/**
 * 计算单个 chunk 的 MD5（使用 spark-md5）
 * @param {boolean} flag 是否需要缓存 buffer
 * @param {string} filePath 文件路径
 * @param {number} offset 起始偏移量
 * @param {number} size 分片大小
 * @returns {Promise<FileHashResult>}
 */
export const getChunkMD5BySpark = (
  flag: boolean,
  filePath: string,
  offset: number,
  size: number,
  fileSize: number
): Promise<FileHashResult> => {
  const end = Math.min(fileSize, offset + size - 1) // 注意结束位置是闭区间
  return new Promise((resolve, reject) => {
    const buffers: Buffer[] = []
    const spark = new SparkMD5.ArrayBuffer()
    const stream = createReadStream(filePath, {
      start: offset,
      end // 注意：end 是闭区间
    })

    stream.on('data', (chunk) => {
      // 累加 ArrayBuffer 到 SparkMD5
      spark.append((chunk as Buffer).buffer as ArrayBuffer)
      // 如果需要缓存 buffer，则拷贝一份
      if (flag) {
        buffers.push(Buffer.from(chunk))
      }
    })

    stream.on('end', () => {
      const result: FileHashResult = {
        md5: spark.end(),
        buffer: flag ? Buffer.concat(buffers) : undefined
      }

      resolve(result)
    })

    stream.on('error', (err) => {
      reject(new Error(`读取文件分片失败: ${err.message}`))
    })
  })
}

interface FileHashResult {
  md5: string
  buffer?: Buffer
}

export default {
  rootDir,
  videoDir,
  windowSizeArray,
  sendError,
  sleep,
  generateErrorMsg,
  APP_ENV,
  getFileMD5
}
