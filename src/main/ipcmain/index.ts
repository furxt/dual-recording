import { ipcMain } from 'electron'
import OnHandler from './onHandler'
import HandleHandler from './handleHandler'

// // 监听渲染进程错误
// ipcMain.on('renderer-error', (_event, error) => {
//   console.error('渲染进程错误:', error)
// })

ipcMain.on('common-on', (event, code, ...args) => {
  const handler = new OnHandler()
  handler.on(event, code, ...args)
})

ipcMain.handle('common-handle', (event, code, ...args) => {
  const handler = new HandleHandler()
  return handler.handle(event, code, ...args)
})
