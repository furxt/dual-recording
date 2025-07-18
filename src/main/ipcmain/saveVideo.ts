import { existsSync, mkdirSync } from 'fs'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { videoDir } from '@main/utils/common'
import { logger } from '@main/utils/logger'
import { getFfmpegPath, runFFmpegTranscode } from '@main/utils/ffmpeg'
import { FileWriter, sendUtil } from '@main/utils'
import { IpcMainInvokeEvent } from 'electron'
import { mainWindow } from '@main/index'
import { SAVE_CHUNK, REPAIR_VIDEO, TRANSCODE_COMPLETE, TRANSCODE_PROGRESS } from '@constants/index'
import PQueue from 'p-queue'

let fileWriter: FileWriter | null

// @ts-expect-error 因为项目打包方式的问题，这里我们使用默认导出，但p-queue又不支持commonjs，所以这一行忽略 el-lint 检查错误
const queue: PQueue = new PQueue.default({ concurrency: 1 }) // 串行队列

/**
 * 保存分片
 */
const saveChunk = async (
  _event: IpcMainInvokeEvent,
  { buffer, uuid, chunkId }
): Promise<Result<void>> => {
  const folderPath = join(videoDir, uuid)
  if (!existsSync(folderPath)) {
    mkdirSync(folderPath, { recursive: true })
    logger.success(`开始录像, ${folderPath} 文件夹创建成功`)
  }

  // 写入 webm 分片文件
  const outputFilePath = join(folderPath, uuid)
  if (!fileWriter) {
    fileWriter = new FileWriter(outputFilePath)
  }
  queue.add(() => {
    if (!fileWriter) {
      return Promise.reject(new Error('fileWriter 未初始化'))
    }
    return fileWriter.append(Buffer.from(buffer), chunkId)
  })
  return { success: true }
}

/**
 * 修复视频时间戳
 */
const repairVideo = async (_event: IpcMainInvokeEvent, { uuid }): Promise<Result<string>> => {
  const ffmpegPath = getFfmpegPath()
  const totalFragmentFile = join(videoDir, uuid, uuid)
  const webmVideoPath = join(videoDir, uuid, `${uuid}.webm`)
  const mp4VideoPath = join(videoDir, uuid, `${uuid}.mp4`)

  try {
    // 等待所有分片写完
    await queue.onIdle()
    fileWriter?.close().then(() => {
      fileWriter = null
    })
    logger.success(`录像结束, ${totalFragmentFile} 文件保存成功`)

    // 修复分片导致时间戳缺失的问题
    const fixedArgs = ['-i', totalFragmentFile, '-c', 'copy', '-fflags', '+genpts', webmVideoPath]
    await runFFmpegTranscode(ffmpegPath, fixedArgs)
    logger.debug(`ffmpeg 修复 ${totalFragmentFile} 文件完成, 已生成 ${webmVideoPath} 文件`)
    // 使用 Promise 包装整个转码异步过程
    new Promise<void>((resolve, reject) => {
      try {
        unlink(totalFragmentFile)
        const ffmpegArgs = [
          '-i',
          webmVideoPath,
          '-c:v',
          'libx264',
          '-preset',
          'medium',
          '-crf',
          '23',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-pix_fmt',
          'yuv420p',
          mp4VideoPath
        ]
        // 执行 FFmpeg 转码WebM → MP4
        logger.debug(`开始转码 ${webmVideoPath} 文件...`)
        runFFmpegTranscode(ffmpegPath, ffmpegArgs, (progress: number) => {
          sendUtil.sendRecord(mainWindow!, TRANSCODE_PROGRESS, progress)
        }).then(() => {
          logger.debug(`ffmpeg ${webmVideoPath} 文件转码成功, 已生成 ${mp4VideoPath} 文件`)
          sendUtil.sendRecord(mainWindow!, TRANSCODE_COMPLETE)
        })
        resolve()
      } catch (err) {
        logger.error(`${mp4VideoPath} 文件转码过程中发生错误: ${err}`)
        reject(err)
      }
    })

    return { success: true, message: '录像本地保存成功', data: webmVideoPath }
  } catch (error) {
    logger.error(`修复 ${totalFragmentFile} 文件时间戳失败: ${error}`)
    return { success: false, error: '录像本地保存失败' }
  }
}

export const videoHandleHandlerArr = [
  { code: SAVE_CHUNK, handler: saveChunk },
  { code: REPAIR_VIDEO, handler: repairVideo }
]
