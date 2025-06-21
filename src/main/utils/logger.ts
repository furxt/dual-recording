import Logger from 'electron-log'
import { join } from 'path'
import { app } from 'electron'
import { dayjs } from 'element-plus'
import { is } from '@electron-toolkit/utils'

// 关闭控制台打印
Logger.transports.console.level = false
Logger.transports.file.level = is.dev ? 'debug' : 'info'
Logger.transports.file.maxSize = 10024300 // 文件最大不超过 10M
// 输出格式
Logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'

const dateStr = dayjs().format('YYYY-MM-DD')
// 文件位置及命名方式
// 默认位置为：C:\Users\[user]\AppData\Roaming\[appname]\electron_log\
// 文件名为：年-月-日.log
// 自定义文件保存位置为安装目录下的 logs\年-月-日.log
Logger.transports.file.resolvePathFn = () => {
  return is.dev
    ? join(app.getAppPath(), 'logs', dateStr + '.log')
    : join(app.getPath('exe'), '..', 'logs', dateStr + '.log')
}

// 有六个日志级别error, warn, info, verbose, debug, silly。默认是silly
export const logger = {
  info(param: string | string[]) {
    if (is.dev) {
      console.log(param)
    } else {
      Logger.info(param)
    }
  },
  warn(param: string | string[]) {
    if (is.dev) {
      console.debug('⚠️', param)
    } else {
      Logger.warn('⚠️', param)
    }
  },
  error(param: string | string[]) {
    if (is.dev) {
      console.error('❌', param)
    } else {
      Logger.error('❌', param)
    }
  },
  success(param: string | string[]) {
    if (is.dev) {
      console.info('✅', param)
    } else {
      Logger.info('✅', param)
    }
  },
  debug(param: string | string[]) {
    if (is.dev) {
      console.debug('🐞', param)
    } else {
      Logger.debug('🐞', param)
    }
  },
  verbose(param: string | string[]) {
    Logger.verbose(param)
  },
  silly(param: string | string[]) {
    Logger.silly(param)
  }
}

export default { logger }
