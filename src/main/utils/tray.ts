import { app, Tray, Menu } from 'electron'
import { common, globalConf, ffmpeg } from '.'
import path from 'path'

export const createTray = (mainWindow: Electron.BrowserWindow): void => {
  const { windowSizeArray } = common
  const { WINDOW_SIZE, localConf } = globalConf

  const tray = new Tray(path.join(app.getAppPath(), 'resources', 'windowTray.png')) // 替换为你的图标路径

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '配置ffmpeg',
      click: async () => {
        ffmpeg.setFfmpegHomePath(false)
      }
    },
    { type: 'separator' },
    {
      label: '分辨率',
      submenu: [
        {
          id: '480',
          label: '480',
          click: (subMenu) => {
            subMenu.checked = false
            const windowSize = windowSizeArray.find((e) => e.id === '480')
            localConf.set(WINDOW_SIZE, windowSize)
            mainWindow.webContents.send('change-resolution')
          }
        },
        {
          id: '720',
          label: '720',
          click: (subMenu) => {
            subMenu.checked = false
            const windowSize = windowSizeArray.find((e) => e.id === '720')
            localConf.set(WINDOW_SIZE, windowSize)
            mainWindow.webContents.send('change-resolution')
          }
        }
      ]
    },
    // {
    //   label: '显示窗口',
    //   click: () => {
    //     if (mainWindow) {
    //       if (mainWindow.isMinimized()) mainWindow.restore()
    //       mainWindow.show()
    //       mainWindow.focus()
    //     }
    //   }
    // },
    // {
    //   label: '隐藏窗口',
    //   click: () => {
    //     if (mainWindow) mainWindow.hide()
    //   }
    // },
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
