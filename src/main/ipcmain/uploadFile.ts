import axios from 'axios'
import { stat } from 'fs/promises'
import { basename, extname } from 'path'
import { logger } from '@main/utils/logger'
import { getFileMD5, getChunkMD5BySpark } from '@main/utils/common'
import { sendUtil } from '@main/utils'
import { envUtil } from '@common/utils'
import { IpcMainInvokeEvent } from 'electron'
import { UPLOAD_FILE, UPDATE_UPLOAD_PROGRESS } from '@common/constants'
import { mainWindow } from '@main/index'
import { unlink } from 'fs/promises'
import type { HandleHandler } from './handler'

// 配置
const CHUNK_SIZE = 1024 * 1024 * 2 // 2MB per chunk

const REQUEST_HEADERS = {}

const uploadFile = async (
  _event: IpcMainInvokeEvent,
  localFilePath: string
): Promise<Result<void>> => {
  localFilePath = localFilePath.slice(0, -5) + '.mp4'
  const UPLOAD_URL = `${envUtil.MAIN_VITE_SEVER_URL}${envUtil.MAIN_VITE_API_PREFIX}${envUtil.MAIN_VITE_SAVE_CHUNK_URL}`
  const MERGE_URL = `${envUtil.MAIN_VITE_SEVER_URL}${envUtil.MAIN_VITE_API_PREFIX}${envUtil.MAIN_VITE_MERGE_CHUNK_URL}`
  const CHECK_URL = `${envUtil.MAIN_VITE_SEVER_URL}${envUtil.MAIN_VITE_API_PREFIX}${envUtil.MAIN_VITE_CHECK_FILE_URL}`

  const result = {
    success: false
  }
  try {
    const fileSize = (await stat(localFilePath)).size
    const fileId = basename(localFilePath, extname(localFilePath))
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE)
    logger.info(`开始上传文件: ${localFilePath}, 共 ${totalChunks} 个分片, fileId: ${fileId}`)
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const chunkSize = CHUNK_SIZE

      // 计算分片的 MD5
      const { md5: chunkMD5, buffer } = await getChunkMD5BySpark(
        true,
        localFilePath,
        start,
        chunkSize,
        fileSize
      )

      const formData = new FormData()
      formData.append('file', new Blob([buffer!], { type: 'application/octet-stream' }), `${i}`)
      formData.append('chunkIndex', `${i}`)
      formData.append('chunkMD5', chunkMD5)
      formData.append('totalChunks', `${totalChunks}`)
      logger.debug(`正在上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片...`)

      const {
        data: { code }
      } = await axios.post(`${UPLOAD_URL}/${fileId}`, formData, {
        headers: REQUEST_HEADERS, // 适用于 node-fetch 或 form-data
        timeout: 1000 * 60
      })

      if (code !== 1) {
        logger.error(`上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片失败`)
        return result
      } else {
        sendUtil.sendRecord(mainWindow!, UPDATE_UPLOAD_PROGRESS, i + 1, totalChunks)
        logger.debug(`${fileId} 的第 ${i + 1} 分片上传成功`)
      }
    }

    logger.success(`${localFilePath} 所有分片上传完成，通知服务端合并文件...`)
    // 通知后端合并文件
    const {
      data: { code }
    } = await axios.get(`${MERGE_URL}/${fileId}`, { params: { totalChunks } })
    if (code !== 1) {
      logger.error(`通知后端合并文件 ${fileId} 失败`)
      return result
    } else {
      logger.success(`${fileId} 文件合并完成`)
    }
    const fileMD5 = await getFileMD5(localFilePath)
    logger.debug(`文件 ${fileId} MD5: ${fileMD5}`)
    const {
      data: { code: resultCode }
    } = await axios.get(`${CHECK_URL}/${fileId}`, { params: { fileMD5 } })
    if (resultCode !== 1) {
      logger.error(`校验检查文件 ${fileId} 失败`)
    } else {
      logger.success(`校验检查文件 ${fileId} 成功`)
      result.success = true
      unlink(localFilePath)
    }
  } catch (err) {
    logger.error(`文件上传失败:\n${err}`)
  }

  return result
}

export const uploadFileHandleHandlerArr = [
  {
    code: UPLOAD_FILE,
    handler: uploadFile
  }
] as HandleHandler[]
