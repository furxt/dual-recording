import fs from 'fs'
import utils from '.'

class FileWriter {
  private logger = utils.logger.logger
  private writeStream: fs.WriteStream | null = null
  private outputFilePath: string
  private isClosed = false

  constructor(outputFilePath: string) {
    this.outputFilePath = outputFilePath
    this.open()
  }

  open(): void {
    this.writeStream = fs.createWriteStream(this.outputFilePath, { flags: 'a' })
    this.logger.info(`${this.outputFilePath} 输入流已经打开`)
    this.writeStream.on('error', (err) => {
      const errMsg = utils.common.generateErrorMsg(err)
      this.logger.error(`写入流发生错误: ${errMsg}`)
    })
  }

  append(buffer: Buffer, index: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.writeStream || this.isClosed) {
        reject(new Error(`${this.outputFilePath} 写入流未打开或已关闭`))
        return
      }

      this.logger.info(`${this.outputFilePath} 开始写入第 ${index + 1} 个分片`)
      const result = this.writeStream.write(buffer, (err) => {
        if (err) {
          this.logger.error(`${this.outputFilePath} 写入第 ${index + 1} 个分片失败`)
          reject(err)
        } else {
          this.logger.success(`${this.outputFilePath} 成功写入第 ${index + 1} 个分片`)
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
        this.logger.success('所有分片写入完成，流已关闭')
        resolve()
      })
    })
  }
}

export default FileWriter
