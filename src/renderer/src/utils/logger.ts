import log from 'electron-log/renderer'
import { IS_DEV } from './common'

export const logger = {
  info(...params: any[]) {
    if (IS_DEV) {
      console.log('Renderer', ...params)
    } else {
      log.info('Renderer', ...params)
    }
  },
  warn(...params: any[]) {
    if (IS_DEV) {
      console.debug('Renderer', '⚠️', ...params)
    } else {
      log.warn('Renderer', '⚠️', ...params)
    }
  },
  error(...params: any[]) {
    if (IS_DEV) {
      console.error('Renderer', '❌', ...params)
    } else {
      log.error('Renderer', '❌', ...params)
    }
  },
  success(...params: any[]) {
    if (IS_DEV) {
      console.info('Renderer', '✅', ...params)
    } else {
      log.info('Renderer', '✅', ...params)
    }
  },
  debug(...params: any[]) {
    if (IS_DEV) {
      console.debug('Renderer', '🐞', ...params)
    } else {
      log.debug('Renderer', '🐞', ...params)
    }
  },
  verbose(...params: any[]) {
    log.verbose('Renderer', ...params)
  },
  silly(...params: any[]) {
    log.silly('Renderer', ...params)
  }
}

export default logger
