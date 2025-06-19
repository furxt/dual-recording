import { IpcMainInvokeEvent } from 'electron'
import utils from '@main/utils'
import type { HandleFunction } from './handleHandler'
import { RECORD_LOG } from '@constant/index'

const recordLog = (
  _event: IpcMainInvokeEvent,
  level: string = 'info',
  arg: string | string[]
): void => {
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
}

export const logHandleHandlerMap = new Map<string, HandleFunction>([[RECORD_LOG, recordLog]])
