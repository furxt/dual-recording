import { app, Tray, Menu } from 'electron'
import { common, globalConf, ffmpeg } from '.'
import path from 'path'

export const createTray = (mainWindow) => {
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
      // submenu: [
      //   {
      //     id: '480',
      //     label: '480',
      //     type: 'checkbox',
      //     checked: conf.get(WINDOW_SIZE).id === '480',
      //     enabled: conf.get(WINDOW_SIZE).id !== '480',
      //     click: (event) => {
      //       // mainWindow.hide()
      //       event.enabled = false
      //       const menu720 = contextMenu.getMenuItemById('720')
      //       menu720.checked = false
      //       menu720.enabled = true

      //       const windowSize = windowSizeArray.find((e) => e.id === '480')
      //       const { windowWidth, windowHeight } = windowSize
      //       conf.set(WINDOW_SIZE, windowSize)

      //       mainWindow.webContents.send('change-resolution', resolution)

      //       // mainWindow.setContentSize(windowWidth, windowHeight)

      //       // setTimeout(() => {
      //       //   mainWindow.show()
      //       //   mainWindow.center()
      //       // }, 1000)
      //     }
      //   },
      //   {
      //     id: '720',
      //     label: '720',
      //     type: 'checkbox',
      //     checked: conf.get(WINDOW_SIZE).id === '720',
      //     enabled: conf.get(WINDOW_SIZE).id !== '720',
      //     click: (event) => {
      //       // mainWindow.hide()
      //       event.enabled = false
      //       const menu480 = contextMenu.getMenuItemById('480')
      //       menu480.checked = false
      //       menu480.enabled = true

      //       const windowSize = windowSizeArray.find((e) => e.id === '720')
      //       const { windowWidth, windowHeight } = windowSize
      //       conf.set(WINDOW_SIZE, windowSize)

      //       mainWindow.webContents.send('change-resolution')
      //       // mainWindow.setContentSize(windowWidth, windowHeight)
      //       // setTimeout(() => {
      //       //   mainWindow.show()
      //       //   mainWindow.center()
      //       // }, 1000)
      //       // relaunch()
      //     }
      //   }
      // ]
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
