import fs from 'fs'
import { logger } from './logger'
import { generateErrorMsg } from './common'

class FileWriter {
  private writeStream: fs.WriteStream | null = null
  private outputFilePath: string
  private isClosed = false

  constructor(outputFilePath: string) {
    this.outputFilePath = outputFilePath
    this.open()
  }

  open(): void {
    this.writeStream = fs.createWriteStream(this.outputFilePath, { flags: 'a' })
    logger.debug(`${this.outputFilePath} 输入流已经打开`)
    this.writeStream.on('error', (err) => {
      const errMsg = generateErrorMsg(err)
      logger.error(`写入流发生错误: ${errMsg}`)
    })
  }

  append(buffer: Buffer, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.writeStream || this.isClosed) {
        reject(new Error(`${this.outputFilePath} 写入流未打开或已关闭`))
        return
      }

      logger.debug(`${this.outputFilePath} 开始写入第 ${index + 1} 个分片`)
      const result = this.writeStream.write(buffer, (err) => {
        if (err) {
          logger.error(`${this.outputFilePath} 写入第 ${index + 1} 个分片失败`)
          reject(err)
        } else {
          logger.debug(`${this.outputFilePath} 成功写入第 ${index + 1} 个分片`)
          resolve()
        }
      })

      // 如果缓冲区满，等待 drain 事件防止内存爆掉
      if (!result) {
        this.writeStream.once('drain', () => {
          resolve()
        })
      }
    })
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.writeStream || this.isClosed) {
        resolve()
        return
      }
      this.isClosed = true
      this.writeStream.end(() => {
        logger.debug('所有分片写入完成，流已关闭')
        resolve()
      })
    })
  }
}

export default FileWriter
