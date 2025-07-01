import log from 'electron-log/renderer'
import { IS_DEV } from './common'

export const logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info(...params: any[]) {
    if (IS_DEV) {
      console.log('Renderer', ...params)
    } else {
      log.info('Renderer', ...params)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn(...params: any[]) {
    if (IS_DEV) {
      console.debug('Renderer⚠️', ...params)
    } else {
      log.warn('Renderer⚠️', ...params)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(...params: any[]) {
    if (IS_DEV) {
      console.error('Renderer❌', ...params)
    } else {
      log.error('Renderer❌', ...params)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success(...params: any[]) {
    if (IS_DEV) {
      console.info('Renderer✅', ...params)
    } else {
      log.info('Renderer✅', ...params)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debug(...params: any[]) {
    if (IS_DEV) {
      console.debug('Renderer-🐞', ...params)
    } else {
      log.debug('Renderer-🐞', ...params)
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verbose(...params: any[]) {
    log.verbose('Renderer', ...params)
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  silly(...params: any[]) {
    log.silly('Renderer', ...params)
  }
}

export default logger
