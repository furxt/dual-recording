import { BrowserWindow, shell, NativeImage } from 'electron'
import { is, platform } from '@electron-toolkit/utils'
import { CLOSE_WINDOW } from '@constant/index'
import path from 'path'
import utils from './index'

export const createMainWindow = async (icon?: NativeImage | string): Promise<BrowserWindow> => {
  // 如果之前存在 mainWindow，则先关闭它

  let mainWindow: BrowserWindow | null = new BrowserWindow({
    show: false,
    // alwaysOnTop: true, // 窗口置顶
    autoHideMenuBar: true,
    frame: false, // 这将隐藏默认的标题栏
    resizable: false, // 禁止调整大小
    // skipTaskbar: true, // 禁止在任务栏中显示
    ...(platform.isWindows || platform.isLinux ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: false
    }
  })
  // 设置默认窗口大小
  const { WINDOW_SIZE, localConf } = utils.globalConf
  if (!localConf.get(WINDOW_SIZE)) {
    localConf.set(WINDOW_SIZE, utils.common.windowSizeArray[0])
  }
  const { windowHeight, windowWidth } = localConf.get(WINDOW_SIZE) as WindowSizeInfo
  mainWindow.setContentSize(windowWidth, windowHeight)
  mainWindow.center()
  // 检查 ffmpegHomePath
  await utils.ffmpeg.checkFfmpegHomePath()

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // 等待页面加载完成后发送请求
  mainWindow.webContents.on('did-finish-load', async () => {})

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    event.preventDefault()
    utils.send.sendApp(mainWindow!, CLOSE_WINDOW)
  })

  // 窗口关闭后释放引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

export default { createMainWindow }
