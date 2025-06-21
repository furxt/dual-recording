import { IpcMainInvokeEvent } from 'electron'
import { logger } from '@main/utils/logger'
import { RECORD_LOG } from '@constants/index'

const recordLog = (
  _event: IpcMainInvokeEvent,
  level: string = 'info',
  arg: string | string[]
): void => {
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
}

export const logHandleHandlerArr = [
  {
    code: RECORD_LOG,
    handler: recordLog
  }
]
