import axios from 'axios'
import type { HandleHandler } from './handler'
import { basename, extname } from 'path'
import { sendUtil, logUtil, commonUtil } from '@main/utils'
import { envUtil } from '@common/utils'
import { IpcMainInvokeEvent } from 'electron'
import { mainWindow } from '@main/index'
import { stat, unlink } from 'fs/promises'
import { UPLOAD_FILE, UPDATE_UPLOAD_PROGRESS } from '@common/constants'

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
    logUtil.info(`开始上传文件: ${localFilePath}, 共 ${totalChunks} 个分片, fileId: ${fileId}`)
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const chunkSize = CHUNK_SIZE

      // 计算分片的 MD5
      const { md5: chunkMD5, buffer } = await commonUtil.getChunkMD5BySpark(
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
      logUtil.debug(`正在上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片...`)

      const {
        data: { code }
      } = await axios.post(`${UPLOAD_URL}/${fileId}`, formData, {
        headers: REQUEST_HEADERS, // 适用于 node-fetch 或 form-data
        timeout: 1000 * 60
      })

      if (code !== 1) {
        logUtil.error(`上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片失败`)
        return result
      } else {
        sendUtil.sendRecord(mainWindow!, UPDATE_UPLOAD_PROGRESS, i + 1, totalChunks)
        logUtil.debug(`${fileId} 的第 ${i + 1} 分片上传成功`)
      }
    }

    logUtil.success(`${localFilePath} 所有分片上传完成，通知服务端合并文件...`)
    // 通知后端合并文件
    const {
      data: { code }
    } = await axios.get(`${MERGE_URL}/${fileId}`, { params: { totalChunks } })
    if (code !== 1) {
      logUtil.error(`通知后端合并文件 ${fileId} 失败`)
      return result
    } else {
      logUtil.success(`${fileId} 文件合并完成`)
    }
    const fileMD5 = await commonUtil.getFileMD5(localFilePath)
    logUtil.debug(`文件 ${fileId} MD5: ${fileMD5}`)
    const {
      data: { code: resultCode }
    } = await axios.get(`${CHECK_URL}/${fileId}`, { params: { fileMD5 } })
    if (resultCode !== 1) {
      logUtil.error(`校验检查文件 ${fileId} 失败`)
    } else {
      logUtil.success(`校验检查文件 ${fileId} 成功`)
      result.success = true
      unlink(localFilePath)
    }
  } catch (err) {
    logUtil.error(`文件上传失败:\n${err}`)
  }

  return result
}

export const uploadFileHandleHandlerArr = [
  {
    code: UPLOAD_FILE,
    handler: uploadFile
  }
] as HandleHandler[]
