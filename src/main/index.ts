import { app, BrowserWindow, dialog, Menu } from 'electron'
import { electronApp, optimizer, is, platform } from '@electron-toolkit/utils'
import { commonUtil, windowUtil, trayUtil } from './utils'
import { logger } from './utils/logger'

import icon from '../../resources/icon.png?asset'
import windowsTray from '../../resources/windowsTray.png?asset'
import './ipcmain'

if (!is.dev) Menu.setApplicationMenu(null)

export let mainWindow: BrowserWindow | null = null

// 主进程全局异常捕获
process.on('uncaughtException', (error, origin) => {
  const errorMessage = `
【主进程未捕获的异常】
${commonUtil.generateErrorMsg(error)}
错误来源: ${origin}
`
  logger.error(errorMessage)
  if (is.dev) commonUtil.sendError(mainWindow!, '程序异常')
})

process.on('unhandledRejection', (reason) => {
  const errorMessage = `
【主进程未处理的 Promise Rejection】
时间: ${new Date().toISOString()}
原因类型: ${typeof reason}
消息: ${reason instanceof Error ? reason.message : String(reason)}
堆栈:
${reason instanceof Error ? reason.stack : '(非 Error 对象，无堆栈信息)'}
原始数据: ${JSON.stringify(reason, null, 2)}
`
  logger.error(errorMessage)
  if (is.dev) commonUtil.sendError(mainWindow!, '程序异常')
})

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
} else {
  if (is.dev) {
    logger.debug('开发环境')
  } else {
    //打包后禁止多开窗口
    app.on('second-instance', () => {
      if (platform.isWindows) {
        // 弹出警告框
        dialog.showMessageBox({
          noLink: true,
          type: 'warning',
          buttons: ['确定'],
          title: '提示',
          message: '当前还有应用窗口在使用，请先关闭退出后再运行使用。',
          detail: '本程序只允许一个窗口存在'
        })
      }
    })
  }
}

// 默认双击应用程序（桌面快捷方式）打开，还有一种是通过浏览器使用自定义协议打开
export let startByApp = true
// 通过浏览器打开应用时传递进来的参数，理论上来说这里应该支持多个类型，每个业务类型都应该有对应的处理逻辑
export let openParam: object
app.whenReady().then(async () => {
  const protocols = 'dualrecording://'
  const argArr = process.argv
  for (const str of argArr) {
    if (str.indexOf(protocols) > -1) {
      const urlParam = str.split(protocols)[1]
      const param = decodeURIComponent(urlParam.substring(0, urlParam.length - 1))
      logger.info(`通过浏览器打开应用传递进来的参数:
        ${param}
        `)
      openParam = JSON.parse(param)
      startByApp = false
      break
    }
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.liyi.dualrecording')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  mainWindow = await windowUtil.createMainWindow(icon)
  trayUtil.createTray(windowsTray, mainWindow)
  // Attach a title bar to the window

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) windowUtil.createMainWindow(icon)
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export default {
  mainWindow
}

if (commonUtil.APP_ENV !== 'production') {
  logger.debug(JSON.stringify(process.versions, null, 2))
  setInterval(() => {
    const mem = process.memoryUsage()
    logger.warn(`主进程内存使用: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`)
  }, 1000 * 10)
}
