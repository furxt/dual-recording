import { ipcMain } from 'electron'
import utils from '../utils'

// 主进程处理定义
ipcMain.handle('logger', (_event, level, arg) => {
  const { logger } = utils.logger
  switch (level) {
    case 'info':
      logger.info(arg)
      break
    case 'warn':
      logger.warn(arg)
      break
    case 'error':
      logger.error(arg)
      break
    case 'debug':
      logger.debug(arg)
      break
    default:
      logger.info(arg)
      break
  }
})
