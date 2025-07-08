import log from 'electron-log/renderer'
import { IS_DEV } from './common'

export const logger = {
  info(...params: unknown[]) {
    if (IS_DEV) {
      console.log('Renderer', ...params)
    } else {
      log.info('Renderer', ...params)
    }
  },

  warn(...params: unknown[]) {
    if (IS_DEV) {
      console.debug('Renderer⚠️', ...params)
    } else {
      log.warn('Renderer⚠️', ...params)
    }
  },

  error(...params: unknown[]) {
    if (IS_DEV) {
      console.error('Renderer❌', ...params)
    } else {
      log.error('Renderer❌', ...params)
    }
  },

  success(...params: unknown[]) {
    if (IS_DEV) {
      console.info('Renderer✅', ...params)
    } else {
      log.info('Renderer✅', ...params)
    }
  },

  debug(...params: unknown[]) {
    if (IS_DEV) {
      console.debug('Renderer-🐞', ...params)
    } else {
      log.debug('Renderer-🐞', ...params)
    }
  },

  verbose(...params: unknown[]) {
    log.verbose('Renderer', ...params)
  },

  silly(...params: unknown[]) {
    log.silly('Renderer', ...params)
  }
}

export default logger
