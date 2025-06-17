import fs from 'fs'
import { dialog } from 'electron'
import { globalConf, logger as logUtils } from '.'

import { mainWindow } from '..'
import path from 'path'
import { platform } from '@electron-toolkit/utils'

export const getFfmpegPath = () => {
  const { localConf, FFMPEG_HOME_PATH } = globalConf
  return path.join(
    localConf.get(FFMPEG_HOME_PATH),
    'bin',
    platform.isWindows ? 'ffmpeg.exe' : 'ffmpeg'
  )
}

export const checkFfmpegHomePath = async () => {
  const { localConf, FFMPEG_HOME_PATH } = globalConf
  const ffmpegHomePath = localConf.get(FFMPEG_HOME_PATH)
  if (!ffmpegHomePath || !fs.existsSync(ffmpegHomePath) || !fs.existsSync(getFfmpegPath())) {
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['确定', '取消'],
      title: 'ffmpeg',
      message: '当前还未配置ffmpeg路径，现在就去配置吗？',
      noLink: true
    })

    if (choice === 1) {
      // 用户点击了 "否"，阻止默认关闭行为
      // app.quit()
      process.exit(0)
    } else {
      await setFfmpegHomePath(true)
    }
  }
}

export const setFfmpegHomePath = async (initFlag) => {
  // 弹出文件夹选择对话框
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'] // 只允许选择文件夹
  })

  if (!result || result.canceled || result.filePaths?.length === 0) {
    return
  }

  const selectedFolderPath = result.filePaths[0]

  logUtils.logger.info(`用户选择的配置ffmpeg文件夹: ${selectedFolderPath}`)

  const ffmpegPath = path.join(selectedFolderPath, 'bin', 'ffmpeg.exe')
  if (!fs.existsSync(ffmpegPath)) {
    await confirmSetFfmpegHomePath(initFlag)
  } else {
    // 保存配置
    const { localConf, FFMPEG_HOME_PATH } = globalConf
    localConf.set(FFMPEG_HOME_PATH, selectedFolderPath)
  }
}

const confirmSetFfmpegHomePath = async (initFlag) => {
  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'question',
    buttons: ['确定', '取消'],
    title: 'ffmpeg',
    message: '配置的路径无效, 准备再次配置吗?',
    noLink: true
  })

  if (choice === 1) {
    // 初始化不配置明白不让用
    if (initFlag) {
      process.exit(0)
    }
  } else {
    await setFfmpegHomePath(initFlag)
  }
}

export default {
  getFfmpegPath,
  checkFfmpegHomePath,
  setFfmpegHomePath
}
