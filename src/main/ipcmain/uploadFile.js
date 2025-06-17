import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { ipcMain } from 'electron'
import crypto from 'crypto'
import { logger as logUtils } from '../utils'
import { mainWindow } from '..'

const logger = logUtils.logger
// 配置
const CHUNK_SIZE = 1024 * 1024 * 2 // 2MB per chunk

const REQUEST_HEADERS = {}

ipcMain.handle(
  'upload-file',
  async (
    _event,
    { localFilePath: webmFilePath, serverUrl, apiPrefix, saveChunkUrl, mergeChunkUrl, checkFileUrl }
  ) => {
    const localFilePath = webmFilePath.slice(0, -5) + '.mp4'
    const result = await uploadFile(
      localFilePath,
      serverUrl,
      apiPrefix,
      saveChunkUrl,
      mergeChunkUrl,
      checkFileUrl
    )
    return result
  }
)
async function uploadFile(
  localFilePath,
  serverUrl,
  apiPrefix,
  saveChunkUrl,
  mergeChunkUrl,
  checkFileUrl
) {
  const UPLOAD_URL = `${serverUrl}${apiPrefix}${saveChunkUrl}`
  const MERGE_URL = `${serverUrl}${apiPrefix}${mergeChunkUrl}`
  const CHECK_URL = `${serverUrl}${apiPrefix}${checkFileUrl}`

  let result = {
    success: false
  }
  try {
    const fileSize = (await fs.promises.stat(localFilePath)).size
    // const fileId = uuidv4().replace(/-/g, '')
    const fileId = path.basename(localFilePath, path.extname(localFilePath))
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)
    logger.info(`开始上传文件: ${localFilePath}, 共 ${totalChunks} 个分片, fileId: ${fileId}`)
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(fileSize - 1, start + CHUNK_SIZE - 1) // 注意结束位置是闭区间
      const chunkSize = end - start + 1
      // 计算分片的 MD5
      const { md5: chunkMD5, buffer } = await getChunkMD5(true, localFilePath, start, chunkSize)
      const formData = new FormData()
      formData.append('file', new Blob([buffer]), `${i}`) // 模拟文件对象
      // formData.append('fileId', fileId)
      formData.append('chunkIndex', i)
      formData.append('chunkMD5', chunkMD5)
      formData.append('totalChunks', totalChunks)

      logger.info(`正在上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片...`)
      const {
        data: { code }
      } = await axios.post(`${UPLOAD_URL}/${fileId}`, formData, {
        headers: REQUEST_HEADERS, // 适用于 node-fetch 或 form-data
        timeout: 1000 * 60
      })

      if (code !== 1) {
        logger.error(`上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片失败`)
        return
      } else {
        mainWindow.webContents.send('update-upload-progress', {
          index: i + 1,
          total: totalChunks
        })

        logger.success(`${fileId} 的第 ${i + 1} 分片上传成功`)
      }

      logger.success(`第 ${i + 1} 分片上传成功`)
    }

    logger.info('所有分片上传完成，通知服务端合并文件...')
    // 通知后端合并文件
    const {
      data: { code }
    } = await axios.get(`${MERGE_URL}/${fileId}`, { params: { totalChunks } })
    if (code !== 1) {
      logger.error(`通知后端合并文件 ${fileId} 失败`)
      return
    } else {
      logger.success(`${fileId} 文件合并完成`)
    }
    const { md5: fileMD5 } = await getChunkMD5(false, localFilePath, 0, fileSize)

    const {
      data: { code: resultCode }
    } = await axios.get(`${CHECK_URL}/${fileId}`, { params: { fileMD5 } })
    if (resultCode !== 1) {
      logger.error(`校验检查文件 ${fileId} 失败`)
    } else {
      logger.success(`校验检查文件 ${fileId} 成功`)
      result.success = true
    }
  } catch (err) {
    logger.error(`文件上传失败:\n${err}`)
  }
  return result
}

/**
 * 计算单个 chunk 的 MD5
 * @param {string} filePath
 * @param {number} offset
 * @param {number} size
 * @returns {Promise<string>}
 */
async function getChunkMD5(flag, filePath, offset, size) {
  return new Promise((resolve, reject) => {
    const buffers = []
    const hash = crypto.createHash('md5')
    const stream = fs.createReadStream(filePath, { start: offset, end: offset + size - 1 })

    stream.on('data', (chunk) => {
      hash.update(chunk)
      if (flag) {
        buffers.push(chunk)
      }
    })

    stream.on('end', () => {
      resolve({ md5: hash.digest('hex'), buffer: Buffer.concat(buffers) })
    })

    stream.on('error', (err) => {
      reject(err)
    })
  })
}
