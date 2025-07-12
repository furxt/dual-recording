import axios from 'axios'
import type { HandleHandler } from './handler'
import { basename, extname } from 'path'
import { sendUtil, logUtil, commonUtil } from '@main/utils'
import { envUtil } from '@common/utils'
import { IpcMainInvokeEvent } from 'electron'
import { mainWindow } from '@main/index'
import { stat, unlink } from 'fs/promises'
import { UPLOAD_FILE, UPDATE_UPLOAD_PROGRESS } from '@common/constants'

const SUCCESS_CODE = 1

// 配置
const CHUNK_SIZE = 1024 * 1024 * 2 // 2MB per chunk

const http = axios.create({
  baseURL: `${envUtil.MAIN_VITE_SEVER_URL}${envUtil.MAIN_VITE_API_PREFIX}`, // 这里是拼接一段前缀，为了解决开发阶段的代理
  timeout: 1000 * 60
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    if (envUtil.MAIN_VITE_AUTH_NAME && envUtil.MAIN_VITE_AUTH_VAL)
      config.headers[envUtil.MAIN_VITE_AUTH_NAME] = envUtil.MAIN_VITE_AUTH_VAL
    return config
  },
  (error) => {
    logUtil.error('请求上传文件错误', error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (res) => {
    const { data } = res
    if (res.status !== 200) {
      throw new Error(data)
    } else {
      console.log(res)
      const {
        config: { baseURL, url }
      } = res
      logUtil.info(
        '请求服务地址:',
        (baseURL || '') + url,
        ', 服务返回数据:',
        `${JSON.stringify(data)}`
      )
      return res
    }
  },
  (error) => {
    logUtil.error('上传文件时服务端响应错误', error)
    return Promise.reject(error)
  }
)

const uploadFile = async (
  _event: IpcMainInvokeEvent,
  localFilePath: string
): Promise<Result<void>> => {
  localFilePath = localFilePath.slice(0, -5) + '.mp4'

  const result = {
    success: false
  }
  try {
    //    // 1. 从服务端获取 RSA 公钥
    // const publicKeyPem = await fetchPublicKeyFromServer();

    // // 2. 生成 AES 密钥并用 RSA 公钥加密
    // const { encryptedKey, iv } = await generateAndEncryptAesKey(publicKeyPem);

    // // 3. 发送加密后的 AES 密钥和 IV 到服务端（可选，或直接存储在前端）
    // // 这里假设服务端已经通过某种方式获取了 encryptedKey 和 iv（如通过另一个 API）

    // // 4. 用 AES 密钥加密分片并上传
    // const chunkSize = 1 * 1024 * 1024; // 1MB 分片
    // const aesKey = await importAesKey(encryptedKey); // 需要实现（略）
    // for (let i = 0; i < totalChunks; i++) {
    //   const start = i * chunkSize;
    //   const end = Math.min(start + chunkSize, file.size);
    //   const chunk = file.slice(start, end);

    //   const buffer = await chunk.arrayBuffer();
    //   const encryptedBuffer = await encryptBuffer(buffer, aesKey, iv);

    //   const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

    //   const formData = new FormData();
    //   formData.append('file', encryptedBlob, `${i}`);
    //   formData.append('chunkIndex', `${i}`);
    //   formData.append('chunkMD5', await calculateMD5(buffer));
    //   formData.append('totalChunks', `${totalChunks}`);
    //   formData.append('fileId', fileId);

    //   await axios.post(`${envUtil.MAIN_VITE_SAVE_CHUNK_URL}/${fileId}`, formData);

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

      // 请求的form表单
      const formData = new FormData()
      formData.append('file', new Blob([buffer!], { type: 'application/octet-stream' }), `${i}`)
      formData.append('chunkIndex', `${i}`)
      formData.append('chunkMD5', chunkMD5)
      formData.append('totalChunks', `${totalChunks}`)
      logUtil.debug(`正在上传 ${fileId} 的第 ${i + 1}/${totalChunks} 片...`)

      // 上传分片
      const {
        data: { code }
      } = await http.post<ApiResponse<void>>(
        `${envUtil.MAIN_VITE_SAVE_CHUNK_URL}/${fileId}`,
        formData
      )

      if (code !== SUCCESS_CODE) {
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
    } = await http.get<ApiResponse<void>>(`${envUtil.MAIN_VITE_MERGE_CHUNK_URL}/${fileId}`, {
      params: { totalChunks }
    })

    if (code !== SUCCESS_CODE) {
      logUtil.error(`通知后端合并文件 ${fileId} 失败`)
      return result
    } else {
      logUtil.success(`${fileId} 文件合并完成`)
    }
    const fileMD5 = await commonUtil.getFileMD5(localFilePath)
    logUtil.debug(`文件 ${fileId} MD5: ${fileMD5}`)
    const {
      data: { code: resultCode }
    } = await http.get<ApiResponse<void>>(`${envUtil.MAIN_VITE_CHECK_FILE_URL}/${fileId}`, {
      params: { fileMD5 }
    })
    if (resultCode !== SUCCESS_CODE) {
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
