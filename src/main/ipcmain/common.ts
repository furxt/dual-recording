import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { mainWindow } from '@main/index'
import utils from '@main/utils'
import { WINDOW_CLOSE, WINDOW_MINIMIZE, RELAUNCH, APP_VERSION, VIDEO_CONFIG } from '@constant/index'
import type { VoidFunction } from './onHandler'
import type { HandleFunction } from './handleHandler'

const {
  logger: { logger },
  globalConf: { localConf, WINDOW_SIZE }
} = utils

const windowClose = (): void => {
  // 移除监听器避免循环
  mainWindow?.removeAllListeners('close')
  app.quit()
}

const windowMinimize = (): void => {
  mainWindow?.minimize()
}

const relaunch = (): void => {
  logger.info('准备重启...')
  if (!is.dev) {
    mainWindow?.removeAllListeners('close') // 移除监听器避免循环
    app.relaunch()
    app.quit()
  } else {
    mainWindow?.hide()
    const { windowWidth, windowHeight } = localConf.get(WINDOW_SIZE) as WindowSizeInfo
    mainWindow?.reload()
    mainWindow?.setContentSize(windowWidth, windowHeight)
    setTimeout(() => {
      mainWindow?.show()
      mainWindow?.center()
    }, 1000)
  }
}

// 获取应用版本
const getAppVersion = (): string => {
  return app.getVersion()
}

// 获取视频配置
const getVideoConfig = (): {
  width: number
  height: number
} => {
  const { resolution } = localConf.get(WINDOW_SIZE) as WindowSizeInfo
  return resolution
}

// ipcMain.handle()
export const commonHandleHandlerMap = new Map<string, HandleFunction>([
  [APP_VERSION, getAppVersion],
  [VIDEO_CONFIG, getVideoConfig]
])

// ipcMain.on()
export const commonOnHandlerMap = new Map<string, VoidFunction>([
  [WINDOW_CLOSE, windowClose],
  [WINDOW_MINIMIZE, windowMinimize],
  [RELAUNCH, relaunch]
])
