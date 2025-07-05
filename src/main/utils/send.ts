import { BrowserWindow } from 'electron'
import { APP_PAGE, RECORD_PAGE } from '@common/constants'

// 发送到主根页面
export const sendApp = (window: BrowserWindow, code: string, ...args: unknown[]): void => {
  window.webContents.send(APP_PAGE, code, ...args)
}

// 发送到录制页面
export const sendRecord = (window: BrowserWindow, code: string, ...args: unknown[]): void => {
  window.webContents.send(RECORD_PAGE, code, ...args)
}

export default { sendApp, sendRecord }
