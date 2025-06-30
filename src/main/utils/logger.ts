import log from 'electron-log/main'
import { join } from 'path'
import { app } from 'electron'
import { dayjs } from 'element-plus'
import { is } from '@electron-toolkit/utils'

// 关闭控制台打印
log.transports.console.level = false
log.transports.file.level = is.dev ? 'debug' : 'info'
log.transports.file.maxSize = 10024300 // 文件最大不超过 10M
// 输出格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'

const dateStr = dayjs().format('YYYY-MM-DD')
// 文件位置及命名方式
// 默认位置为：C:\Users\[user]\AppData\Roaming\[appname]\electron_log\
// 文件名为：年-月-日.log
// 自定义文件保存位置为安装目录下的 logs\年-月-日.log
log.transports.file.resolvePathFn = () => {
  return is.dev
    ? join(app.getAppPath(), 'logs', dateStr + '.log')
    : join(app.getPath('exe'), '..', 'logs', dateStr + '.log')
}

// initialize the logger for any renderer process
log.initialize()

// 有六个日志级别error, warn, info, verbose, debug, silly。默认是silly
export const logger = {
  info(...params: any[]) {
    if (is.dev) {
      console.log('Main', ...params)
    } else {
      log.info('Main', ...params)
    }
  },
  warn(...params: any[]) {
    if (is.dev) {
      console.debug('Main', '⚠️', ...params)
    } else {
      log.warn('Main', '⚠️', ...params)
    }
  },
  error(...params: any[]) {
    if (is.dev) {
      console.error('Main', '❌', ...params)
    } else {
      log.error('Main', '❌', ...params)
    }
  },
  success(...params: any[]) {
    if (is.dev) {
      console.info('Main', '✅', ...params)
    } else {
      log.info('Main', '✅', ...params)
    }
  },
  debug(...params: any[]) {
    if (is.dev) {
      console.debug('Main', '🐞', ...params)
    } else {
      log.debug('Main', '🐞', ...params)
    }
  },
  verbose(...params: any[]) {
    log.verbose('Main', ...params)
  },
  silly(...params: any[]) {
    log.silly('Main', ...params)
  }
}

export default logger
