import { join } from 'path'
import { existsSync } from 'fs'
import { spawn } from 'child_process'
import { app, dialog } from 'electron'
import { localConf, FFMPEG_HOME_PATH } from './globalConf'
import { logger } from './logger'
import { mainWindow } from '@main/index'
import { platform } from '@electron-toolkit/utils'

export const getFfmpegPath = (): string => {
  return join(
    localConf.get(FFMPEG_HOME_PATH) as string,
    'bin',
    platform.isWindows ? 'ffmpeg.exe' : 'ffmpeg'
  )
}

export const checkFfmpegHomePath = async (): Promise<void> => {
  const ffmpegHomePath = localConf.get(FFMPEG_HOME_PATH) as string
  if (!ffmpegHomePath || !existsSync(ffmpegHomePath) || !existsSync(getFfmpegPath())) {
    const choice = dialog.showMessageBoxSync(mainWindow!, {
      type: 'question',
      buttons: ['确定', '取消'],
      title: 'ffmpeg',
      message: '当前未检测到有效的ffmpeg目录配置，现在就去配置吗？',
      noLink: true
    })

    if (choice === 1) {
      // 用户点击了 "否"，阻止默认关闭行为
      app.quit()
    } else {
      await setFfmpegHomePath(true)
    }
  }
}

export const setFfmpegHomePath = async (initFlag: boolean): Promise<void> => {
  // 弹出文件夹选择对话框
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'] // 只允许选择文件夹
  })

  if (!result || result.canceled || result.filePaths?.length === 0) {
    return
  }

  const selectedFolderPath = result.filePaths[0]

  logger.debug(`用户选择的配置ffmpeg文件夹: ${selectedFolderPath}`)

  const ffmpegPath = join(selectedFolderPath, 'bin', 'ffmpeg.exe')
  if (!existsSync(ffmpegPath)) {
    await confirmSetFfmpegHomePath(initFlag)
  } else {
    // 保存配置
    localConf.set(FFMPEG_HOME_PATH, selectedFolderPath)
  }
}

const confirmSetFfmpegHomePath = async (initFlag: boolean): Promise<void> => {
  const choice = dialog.showMessageBoxSync(mainWindow!, {
    type: 'question',
    buttons: ['确定', '取消'],
    title: 'ffmpeg',
    message: '配置的路径无效, 准备再次配置吗?',
    noLink: true
  })

  if (choice === 1) {
    // 初始化不配置明白不让用
    if (initFlag) {
      app.quit()
    }
  } else {
    await setFfmpegHomePath(initFlag)
  }
}

/**
 * 运行 FFmpeg 任务
 * @param ffmpegPath FFmpeg 的路径
 * @param args FFmpeg 的参数
 * @param callback  进度回调函数, 函数的入参就是整体进度数值, 然后自行处理, 但这个数值不太精确, 最终你还是要 await 确认执行完了
 */
export const runFFmpegTranscode = (
  ffmpegPath: string,
  args: string[],
  callback?: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath, args)

    // 监听错误输出（stderr）
    let stdOutput = ''
    let totalDuration: number | null = null
    ffmpeg.stderr.on('data', (data) => {
      stdOutput = data.toString()
      // logger.debug(`FFmpeg 执行时输出的信息: ${line}`)

      // 提取 duration（总时长）
      const durationMatch = stdOutput.match(/Duration:\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
      if (durationMatch) {
        totalDuration = parseTimeToSeconds(durationMatch[1])
        logger.debug(`总时长: ${totalDuration}s`)
      }
      // 提取当前 time
      const timeMatch = stdOutput.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/)
      if (timeMatch && totalDuration) {
        const currentTime = parseTimeToSeconds(timeMatch[1])
        const progress = Math.min((currentTime / totalDuration) * 100, 100)
        if (callback) {
          callback(Math.floor(progress))
        }
        logger.debug('当前进度:', `${Math.floor(progress)}%`)
      }
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logger.debug('FFmpeg 执行命令', ffmpegPath, args.join(' '), '成功')
        resolve()
      } else {
        const errorMessage = `FFmpeg 执行命令 ${ffmpegPath} ${args.join(' ')} 失败, 退出码: ${code}\nstderr 完整输出:\n${stdOutput}`
        logger.error(errorMessage)
        reject(new Error(errorMessage))
      }
    })

    ffmpeg.on('error', (err) => {
      logger.error(`启动 FFmpeg 时发生错误\n: ${err.message}`)
      reject(err)
    })

    // 如果你想主动中断任务，可以调用 ffmpeg.kill()
    // ffmpeg.kill(); // 手动杀死子进程
  })
}

// 将 HH:mm:ss.SS 格式转换成秒
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(parseFloat)
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

export default {
  getFfmpegPath,
  checkFfmpegHomePath,
  setFfmpegHomePath,
  runFFmpegTranscode
}
