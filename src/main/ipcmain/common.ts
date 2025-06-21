import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { mainWindow } from '@main/index'
import { localConf, WINDOW_SIZE } from '@main/utils/globalConf'
import { logger } from '@main/utils/logger'
import { join } from 'path'
import {
  WINDOW_CLOSE,
  WINDOW_MINIMIZE,
  RELAUNCH,
  APP_VERSION,
  APP_ICON_PATH,
  VIDEO_CONFIG
} from '@constants/index'

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

// 获取应用图标路径
const getAppIconPath = (): string => {
  return join(app.getAppPath(), 'resources', 'icon.png')
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
export const commonHandleHandlerArr = [
  {
    code: APP_VERSION,
    handler: getAppVersion
  },
  {
    code: APP_ICON_PATH,
    handler: getAppIconPath
  },
  {
    code: VIDEO_CONFIG,
    handler: getVideoConfig
  }
]

// ipcMain.on()
export const commonOnHandlerArr = [
  {
    code: WINDOW_CLOSE,
    handler: windowClose
  },
  {
    code: WINDOW_MINIMIZE,
    handler: windowMinimize
  },
  {
    code: RELAUNCH,
    handler: relaunch
  }
]
