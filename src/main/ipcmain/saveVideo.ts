import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import PQueue from 'p-queue'
import utils, { FileWriter } from '../utils'
import { mainWindow } from '..'

const { videoDir } = utils.common
const { logger } = utils.logger
const { getFfmpegPath } = utils.ffmpeg

let fileWriter: FileWriter | null
// 串行队列
let queue
ipcMain.handle('save-chunk', async (_event, { buffer, uuid, chunkId }) => {
  const folderPath = path.join(videoDir, uuid)
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true })
    logger.success(`${folderPath} 文件夹创建成功`)
  }

  // 创建串行队列
  if (!queue) {
    if (queue) await queue.onIdle()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queue = new (PQueue as any).default({ concurrency: 1 }) // ⚠️ 牺牲类型安全
  }

  // 写入 webm 分片文件
  const outputFilePath = path.join(folderPath, uuid)
  if (!fileWriter) {
    fileWriter = new FileWriter(outputFilePath)
  }
  queue.add(() => fileWriter?.append(Buffer.from(buffer), chunkId))
  return { success: true }
})

ipcMain.handle('repair-video', async (_event, { uuid }) => {
  const ffmpegPath = getFfmpegPath()
  const totalFragmentFile = path.join(videoDir, uuid, uuid)
  const webmVideoPath = path.join(videoDir, uuid, `${uuid}.webm`)
  const mp4VideoPath = path.join(videoDir, uuid, `${uuid}.mp4`)

  try {
    // 等待所有分片写完
    await queue.onIdle()

    fileWriter?.close().then(() => {
      fileWriter = null
    })

    // 修复分片导致时间戳缺失的问题
    const fixedArgs = ['-i', totalFragmentFile, '-c', 'copy', '-fflags', '+genpts', webmVideoPath]
    await runFFmpegTranscode(ffmpegPath, fixedArgs)
    logger.success(`ffmpeg 修复 ${totalFragmentFile} 文件完成, 已生成 ${webmVideoPath} 文件`)

    // 使用 Promise 包装整个转码异步过程
    new Promise<void>((resolve, reject) => {
      try {
        fs.promises.unlink(totalFragmentFile)
        const ffmpegArgs = [
          '-i',
          webmVideoPath,
          '-c:v',
          'libx264',
          '-preset',
          'fast',
          '-crf',
          '23',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
          '-pix_fmt',
          'yuv420p',
          '-vf',
          'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          mp4VideoPath
        ]
        // 执行 FFmpeg 转码WebM → MP4
        logger.info(`开始转码 ${webmVideoPath} 文件...`)
        runFFmpegTranscode(ffmpegPath, ffmpegArgs).then(() => {
          logger.success(`ffmpeg ${webmVideoPath} 文件转码成功, 已生成 ${mp4VideoPath} 文件`)
          mainWindow?.webContents.send('transcode-complete')
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
})

const runFFmpegTranscode = (ffmpegPath, args): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, args)

    // let stdoutBuffer = ''
    // 监听标准输出（stdout）
    // ffmpeg.stdout.on('data', (data) => {
    //   const output = data.toString()
    //   stdoutBuffer += output
    // })

    // 监听错误输出（stderr）
    let stderrBuffer = ''
    ffmpeg.stderr.on('data', (data) => {
      const errorOutput = data.toString()
      stderrBuffer += errorOutput
      // logger.error(`FFmpeg 执行时的错误信息: ${errorOutput}`) // 实时打印 stderr
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logger.success(`FFmpeg 执行命令【${ffmpegPath} ${args.join(' ')}】成功`)
        resolve()
      } else {
        const errorMessage = `FFmpeg 执行命令【${ffmpegPath} ${args.join(' ')}】失败, 退出码: ${code}\nstderr 完整输出:\n${stderrBuffer}`
        logger.error(errorMessage)
        reject(new Error(errorMessage))
      }
      // ffmpeg = null
    })

    ffmpeg.on('error', (err) => {
      logger.error(`启动 FFmpeg 时发生错误: ${err.message}`)
      reject(err)
    })

    // 如果你想主动中断任务，可以调用 ffmpeg.kill()
    // ffmpeg.kill(); // 手动杀死子进程
  })
}
