import handler from './handler'
import { ipcMain } from 'electron'

ipcMain.on('common-on', (event, code, ...args) => {
  handler.on(event, code, ...args)
})

ipcMain.handle('common-handle', (event, code, ...args) => {
  return handler.handle(event, code, ...args)
})
