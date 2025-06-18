import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, is, platform, optimizer } from '@electron-toolkit/utils'
import utils from './utils'
import icon from '../../resources/icon.png?asset'
import './ipcmain'

const { logger } = utils.logger

// web端口
export let mainWindow
// 启用硬件加速
app.commandLine.appendSwitch('enable-accelerated-video-decode')

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

// 主进程全局异常捕获
process.on('uncaughtException', (error, origin) => {
  const errorMessage = `
【主进程未捕获的异常】
时间: ${new Date().toISOString()}
错误信息: ${error.message}
错误名称: ${error.name}
错误堆栈:
${error.stack || '(无堆栈信息)'}
错误来源: ${origin}
`
  logger.error(errorMessage)
  utils.common.sendError(mainWindow, '程序异常')
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
  utils.common.sendError(mainWindow, '程序异常')
})

// 监听渲染进程错误
ipcMain.on('renderer-error', (event, error) => {
  console.error('渲染进程错误:', error)
})

// // 注册私有协议
// protocol.registerSchemesAsPrivileged([
//   {
//     scheme: 'localvideo',
//     privileges: {
//       secure: true, //将自定义协议视为安全的，类似https
//       supportFetchAPI: true, //允许使用fetch
//       standard: true, //将自定义协议视为标准协议，类似http
//       bypassCSP: true, //允许绕过安全内容检查
//       stream: true //启用对响应流的支持
//     }
//   }
// ])

// const convertPath = (originalPath) => {
//   // 检查路径是否以/开头，且之后是单个字母跟一个符号（就是windows磁盘符）
//   const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/)
//   if (match) {
//     return `${match[1]}:/${match[2]}`
//   } else {
//     return originalPath
//   }
// }

// Create the browser window.
export async function createWindow() {
  // 如果之前存在 mainWindow，则先关闭它

  mainWindow = new BrowserWindow({
    show: false,
    // alwaysOnTop: true, // 窗口置顶
    autoHideMenuBar: true,
    frame: false, // 这将隐藏默认的标题栏
    resizable: false, // 禁止调整大小
    // skipTaskbar: true, // 禁止在任务栏中显示
    ...(platform.isWindows || platform.isLinux ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
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
  const { windowHeight, windowWidth } = localConf.get(WINDOW_SIZE)
  mainWindow.setContentSize(windowWidth, windowHeight)
  mainWindow.center()
  // 检查 ffmpegHomePath
  await utils.ffmpeg.checkFfmpegHomePath()

  // const CHUNK_SIZE = 10 ** 6 // 1MB
  // // 注册自定义协议处理本地文件请求
  // protocol.handle('localvideo', async (request) => {
  //   console.log(request)

  //   try {
  //     const decodeUrl = decodeURIComponent(
  //       request.url.replace(new RegExp('^localvideo:/', 'i'), '')
  //     )
  //     console.log('decodeUrl', decodeUrl)
  //     const filePath = process.platform === 'win32' ? convertPath(decodeUrl) : decodeUrl
  //     console.log('filePath', filePath)

  //     // 检查文件是否存在
  //     const fileStats = await stat(filePath)
  //     const fileSize = fileStats.size
  //     // 获取 Range 请求头
  //     const rangeHeader = request.headers.get('Range')

  //     // return new Response(fs.readFileSync(filePath), {
  //     //   headers: {
  //     //     'Content-Type': 'video/mp4',
  //     //     'Content-Length': String(fileSize),
  //     //     'Access-Control-Allow-Origin': '*'
  //     //   }
  //     // })
  //     if (!rangeHeader) {
  //       return new Response(fs.createReadStream(filePath), {
  //         headers: {
  //           'Content-Type': 'video/mp4',
  //           'Content-Length': String(fileSize),
  //           'Access-Control-Allow-Origin': '*'
  //         }
  //       })
  //     }

  //     // 解析 Range
  //     const rangeMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/)
  //     if (!rangeMatch) {
  //       return new Response(null, {
  //         status: 416,
  //         statusText: 'Requested Range Not Satisfiable',
  //         headers: {
  //           'Content-Range': `bytes */${fileSize}`
  //         }
  //       })
  //     }

  //     const start = parseInt(rangeMatch[1], 10)
  //     const end = rangeMatch[2]
  //       ? parseInt(rangeMatch[2], 10)
  //       : Math.min(start + CHUNK_SIZE, fileSize - 1)

  //     if (start >= fileSize || end >= fileSize) {
  //       return new Response(null, {
  //         status: 416,
  //         statusText: 'Requested Range Not Satisfiable',
  //         headers: {
  //           'Content-Range': `bytes */${fileSize}`
  //         }
  //       })
  //     }

  //     const contentLength = end - start + 1

  //     console.log(1)

  //     return new Response(fs.createReadStream(filePath, { start, end }), {
  //       headers: {
  //         'Content-Type': 'video/mp4',
  //         'Content-Length': String(contentLength),
  //         'Content-Range': `bytes ${start}-${end}/${fileSize}`,
  //         'Access-Control-Allow-Origin': '*',
  //         status: 206
  //       }
  //     })
  //   } catch (err) {
  //     logger.error(`加载视频失败: ${err}`)
  //     return new Response(null, {
  //       status: 404,
  //       statusText: 'Not Found'
  //     })
  //   }
  // })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // 等待页面加载完成后发送请求
  mainWindow.webContents.on('did-finish-load', async () => {})

  // 监听窗口关闭事件
  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow.webContents.send('close-window')
  })

  // 窗口关闭后释放引用
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 默认双击应用程序（桌面快捷方式）打开，还有一种是通过浏览器使用自定义协议打开
let startByApp = true
// 通过浏览器打开应用时传递进来的参数
let openParam
app.whenReady().then(() => {
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

  electronApp.setAppUserModelId('com.liyi.dualrecording')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (event, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()
  utils.tray.createTray(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!platform.isMacOS) {
    app.quit()
  }
})
