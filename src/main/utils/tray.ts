import { app, Tray, Menu, NativeImage } from 'electron'
import { windowSizeArray } from './common'
import { localConf } from './globalConf'
import { CONF_WINDOW_SIZE } from '@constants/index'
import { setFfmpegHomePath } from './ffmpeg'
import { sendApp, sendRecord } from './send'
import { checkUpdate } from './autoUpdate'
import { showWindow } from './window'
import { PRIMARY_MESSAGE, CHANGE_RESOLUTION } from '@constants/index'
export const createTray = (
  icon: NativeImage | string,
  mainWindow: Electron.BrowserWindow
): void => {
  // const tray = new Tray(path.join(app.getAppPath(), 'resources', 'windowsTray.png')) // 替换为你的图标路径
  const tray = new Tray(icon) // 替换为你的图标路径

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '配置ffmpeg',
      click: async () => {
        setFfmpegHomePath(false)
      }
    },
    {
      label: '分辨率',
      submenu: [
        {
          id: '480',
          label: '480',
          click: () => {
            const windowSize = windowSizeArray.find((e) => e.id === '480')
            localConf.set(CONF_WINDOW_SIZE, windowSize)
            showWindow(mainWindow)
            if (
              windowSize &&
              0 <= mainWindow.getContentSize()[0] - windowSize.windowWidth &&
              mainWindow.getContentSize()[0] - windowSize.windowWidth <= 5
            ) {
              sendApp(mainWindow, PRIMARY_MESSAGE, '当前分辨率已设置为480p')
              return
            }
            sendRecord(mainWindow, CHANGE_RESOLUTION)
          }
        },
        {
          id: '720',
          label: '720',
          click: () => {
            const windowSize = windowSizeArray.find((e) => e.id === '720')
            localConf.set(CONF_WINDOW_SIZE, windowSize)
            showWindow(mainWindow)
            if (
              windowSize &&
              0 <= mainWindow.getContentSize()[0] - windowSize.windowWidth &&
              mainWindow.getContentSize()[0] - windowSize.windowWidth <= 5
            ) {
              sendApp(mainWindow, PRIMARY_MESSAGE, '当前分辨率已设置为720p')
              return
            }
            sendRecord(mainWindow, CHANGE_RESOLUTION)
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '检查更新',
      click: () => {
        checkUpdate(undefined, true)
      }
    },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    showWindow(mainWindow)
  })
}

export default {
  createTray
}
