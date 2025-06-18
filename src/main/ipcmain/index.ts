import { app, ipcMain, Menu } from 'electron'
import { is } from '@electron-toolkit/utils'
import utils from '../utils'
import { mainWindow } from '..'
import './logger'
import './saveVideo'
import './uploadFile'
import './autoUpdate'

const { logger } = utils.logger
const { localConf, WINDOW_SIZE } = utils.globalConf

/**
 * 退出应用
 */
ipcMain.on('quit', () => {
  const template = [
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ]
  Menu.buildFromTemplate(template).popup()
})

/**
 * 获取应用路径
 */
ipcMain.handle('getAppPath', () => {
  return is.dev ? app.getAppPath() : app.getPath('exe')
})

// 获取应用版本
ipcMain.handle('app-version', () => {
  return app.getVersion()
})

// 获取视频配置
ipcMain.handle('get-video-config', () => {
  const { resolution } = localConf.get(WINDOW_SIZE) as WindowSizeInfo
  return resolution
})

// 关闭窗口
ipcMain.on('window-close', async () => {
  mainWindow?.removeAllListeners('close') // 移除监听器避免循环
  app.quit()
  // mainWindow.close(); // 真正关闭窗口
})

// 最小化窗口
ipcMain.on('window-minimize', async () => {
  mainWindow?.minimize()
})

// 重启
ipcMain.on('relaunch', async () => {
  logger.info('重启中...')
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
})

// 监听渲染进程错误
ipcMain.on('renderer-error', (_event, error) => {
  console.error('渲染进程错误:', error)
})
