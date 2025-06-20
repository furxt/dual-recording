import { BrowserWindow } from 'electron'
import { APP_PAGE, RECORD_PAGE } from '@constants/index'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendApp = (window: BrowserWindow, code: string, ...args: any[]): void => {
  window.webContents.send(APP_PAGE, code, ...args)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sendRecord = (window: BrowserWindow, code: string, ...args: any[]): void => {
  window.webContents.send(RECORD_PAGE, code, ...args)
}

export default { sendApp, sendRecord }
