import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { mainWindow } from '@main/index'
import { localConf } from '@main/utils/globalConf'
import { logger } from '@main/utils/logger'
import type { OnHandler, HandleHandler } from './handler'
import {
  WINDOW_CLOSE,
  WINDOW_MINIMIZE,
  RELAUNCH,
  APP_VERSION,
  CONF_WINDOW_SIZE
} from '@common/constants'

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
    const { windowWidth, windowHeight } = localConf.get(CONF_WINDOW_SIZE) as WindowSizeInfo
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

// ipcMain.handle()
export const commonHandleHandlerArr: HandleHandler[] = [
  {
    code: APP_VERSION,
    handler: getAppVersion
  }
]

// ipcMain.on()
export const commonOnHandlerArr: OnHandler[] = [
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
