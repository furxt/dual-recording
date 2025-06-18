import { ipcMain } from 'electron'
import { autoUpdate, logger } from '../utils'

ipcMain.on('download-update', () => {
  autoUpdate.downloadUpdate()
})

ipcMain.on('install-update', () => {
  autoUpdate.installUpdate()
})

ipcMain.handle('check-update', () => {
  logger.logger.info('检查更新')
  autoUpdate.autoUpdateApp()
})
