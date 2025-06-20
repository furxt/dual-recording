import { app, Tray, Menu, NativeImage } from 'electron'
import { common, globalConf, ffmpeg, send } from './index'
import { PRIMARY_MESSAGE, CHANGE_RESOLUTION } from '@constants/index'
export const createTray = (
  icon: NativeImage | string,
  mainWindow: Electron.BrowserWindow
): void => {
  const { windowSizeArray } = common
  const { WINDOW_SIZE, localConf } = globalConf

  // const tray = new Tray(path.join(app.getAppPath(), 'resources', 'windowsTray.png')) // 替换为你的图标路径
  const tray = new Tray(icon) // 替换为你的图标路径

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '配置ffmpeg',
      click: async () => {
        ffmpeg.setFfmpegHomePath(false)
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
            const windowSizeArr = mainWindow.getContentSize()
            localConf.set(WINDOW_SIZE, windowSize)
            if (windowSize && windowSizeArr[0] - windowSize.windowWidth < 5) {
              send.sendApp(mainWindow, PRIMARY_MESSAGE, '当前分辨率已设置为480p')
              return
            }
            send.sendRecord(mainWindow, CHANGE_RESOLUTION)
          }
        },
        {
          id: '720',
          label: '720',
          click: () => {
            const windowSize = windowSizeArray.find((e) => e.id === '720')
            const windowSizeArr = mainWindow.getContentSize()
            localConf.set(WINDOW_SIZE, windowSize)
            if (windowSize && windowSizeArr[0] - windowSize.windowWidth < 5) {
              send.sendApp(mainWindow, PRIMARY_MESSAGE, '当前分辨率已设置为720p')
              return
            }
            send.sendRecord(mainWindow, CHANGE_RESOLUTION)
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export default {
  createTray
}
