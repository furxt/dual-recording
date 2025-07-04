import { autoUpdater } from 'electron-updater'
import { sendApp } from './send'
import { logger } from './logger'
import { APP_ENV, generateErrorMsg, sendError } from './common'
import { mainWindow } from '@main/index'
import {
  UPDATE_AVAILABLE,
  DOWNLOAD_PROGRESS,
  UPDATE_DOWNLOADED,
  PRIMARY_MESSAGE
} from '@constants/index'
import { IpcMainInvokeEvent } from 'electron'
import { platform } from '@electron-toolkit/utils'
import { activateCheckAppUpdateMenu } from './tray'

// 每次启动自动更新检查更新版本
autoUpdater.logger = logger
autoUpdater.disableWebInstaller = false
// 这个写成 false，写成 true 时，可能会报没权限更新
autoUpdater.autoDownload = false

// 设置远程更新地址
if (APP_ENV === 'production') {
  autoUpdater.setFeedURL('http://localhost:8099/packages/win32/')
  // 如果有必要你还可用根据操作系统平台适配不同的更新地址
} else if (APP_ENV === 'test') {
  autoUpdater.setFeedURL('http://localhost:8099/packages/win32/')
}

let isUpdateAvailable = false

// autoUpdater.on('error', (error, message) => {
//   // 我先面捕获了异常错误，这里就不先处理
// })

// 当有可用更新的时候触发。 更新将自动下载。
autoUpdater.on('update-available', (info) => {
  isUpdateAvailable = true
  // 检查到可用更新，交由用户提示是否下载
  const { version } = info
  logger.info(`检查有新版本可用: ${version}`)
  sendApp(mainWindow!, UPDATE_AVAILABLE, version)
})

// 下载更新包的进度，可以用于显示下载进度与前端交互等
autoUpdater.on('download-progress', async (progress) => {
  // 计算下载百分比
  const downloadPercent = Math.round(progress.percent * 100) / 100
  logger.info(`下载进度: ${downloadPercent}%`)
  // 实时同步下载进度到渲染进程，以便于渲染进程显示下载进度
  sendApp(mainWindow!, DOWNLOAD_PROGRESS, downloadPercent)
})

// 在更新下载完成的时候触发。
autoUpdater.on('update-downloaded', () => {
  logger.info('下载完毕!提示安装更新')
  // 下载完成之后，弹出对话框提示用户是否立即安装更新
  sendApp(mainWindow!, UPDATE_DOWNLOADED)
})

/**
 * 用户确定是否下载更新
 */
export const downloadUpdate = (): void => {
  autoUpdater.downloadUpdate()
}

/**
 * 退出并安装更新
 */
export const installUpdate = (): void => {
  mainWindow?.removeAllListeners('close')
  autoUpdater.quitAndInstall()
}

export const generalCheckUpdate = (needWarn: boolean): void => {
  autoUpdater
    .checkForUpdates()
    .then(() => {
      if (!isUpdateAvailable) {
        if (needWarn) sendApp(mainWindow!, PRIMARY_MESSAGE, '你当前已是最新版本!')
      }
    })
    .catch((error) => {
      const errorMsg = generateErrorMsg(error)
      logger.error(
        `检查更新失败:
      ${errorMsg}`
      )
      if (needWarn) {
        sendError(mainWindow!, '检查更新失败!')
      }
    })
}

/**
 * 自动更新的逻辑
 */
export const checkUpdate = (
  _event: IpcMainInvokeEvent,
  appUpdateServer: string,
  winUpdateUrl: string,
  linuxUpdateUrl: string,
  macUpdateUrl: string
): void => {
  // 设置远程更新地址, 根据操作系统平台适配不同的更新地址
  if (platform.isWindows) {
    autoUpdater.setFeedURL(`${appUpdateServer}${winUpdateUrl}`)
  } else if (platform.isLinux) {
    autoUpdater.setFeedURL(`${appUpdateServer}${linuxUpdateUrl}`)
  } else if (platform.isMacOS) {
    autoUpdater.setFeedURL(`${appUpdateServer}${macUpdateUrl}`)
  }
  activateCheckAppUpdateMenu()
  generalCheckUpdate(false)
}

export default {
  checkUpdate,
  downloadUpdate,
  installUpdate,
  generalCheckUpdate
}
