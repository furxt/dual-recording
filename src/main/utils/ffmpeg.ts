import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { app, dialog } from 'electron'
import { globalConf } from '.'
import { logger } from './logger'
import { mainWindow } from '..'
import { platform } from '@electron-toolkit/utils'

export const getFfmpegPath = (): string => {
  const { localConf, FFMPEG_HOME_PATH } = globalConf
  return path.join(
    localConf.get(FFMPEG_HOME_PATH) as string,
    'bin',
    platform.isWindows ? 'ffmpeg.exe' : 'ffmpeg'
  )
}

export const checkFfmpegHomePath = async (): Promise<void> => {
  const { localConf, FFMPEG_HOME_PATH } = globalConf
  const ffmpegHomePath = localConf.get(FFMPEG_HOME_PATH) as string
  if (!ffmpegHomePath || !fs.existsSync(ffmpegHomePath) || !fs.existsSync(getFfmpegPath())) {
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

export const setFfmpegHomePath = async (initFlag): Promise<void> => {
  // 弹出文件夹选择对话框
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'] // 只允许选择文件夹
  })

  if (!result || result.canceled || result.filePaths?.length === 0) {
    return
  }

  const selectedFolderPath = result.filePaths[0]

  logger.info(`用户选择的配置ffmpeg文件夹: ${selectedFolderPath}`)

  const ffmpegPath = path.join(selectedFolderPath, 'bin', 'ffmpeg.exe')
  if (!fs.existsSync(ffmpegPath)) {
    await confirmSetFfmpegHomePath(initFlag)
  } else {
    // 保存配置
    const { localConf, FFMPEG_HOME_PATH } = globalConf
    localConf.set(FFMPEG_HOME_PATH, selectedFolderPath)
  }
}

const confirmSetFfmpegHomePath = async (initFlag): Promise<void> => {
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
 */
export const runFFmpegTranscode = (ffmpegPath: string, args: string[]): Promise<void> => {
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
    })

    ffmpeg.on('error', (err) => {
      logger.error(`启动 FFmpeg 时发生错误: ${err.message}`)
      reject(err)
    })

    // 如果你想主动中断任务，可以调用 ffmpeg.kill()
    // ffmpeg.kill(); // 手动杀死子进程
  })
}

export default {
  getFfmpegPath,
  checkFfmpegHomePath,
  setFfmpegHomePath,
  runFFmpegTranscode
}
