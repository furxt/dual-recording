import { IpcMainInvokeEvent } from 'electron'
import { commonHandleHandlerMap } from './common'
import { autoUpdateHandleHandlerMap } from './autoUpdate'
import { logHandleHandlerMap } from './logger'
import { videoHandleHandlerMap } from './saveVideo'
import { uploadFileHandleHandlerMap } from './uploadFile'
import utils from '@main/utils'

class HandleHandler {
  private handlerMap = new Map<string, HandleFunction>()

  constructor() {
    this.init()
  }

  init(): void {
    const handlerArrMap = [
      commonHandleHandlerMap,
      autoUpdateHandleHandlerMap,
      logHandleHandlerMap,
      videoHandleHandlerMap,
      uploadFileHandleHandlerMap
    ]
    handlerArrMap.forEach((handlerMap) => {
      handlerMap.forEach((value, key) => {
        this.handlerMap.set(key, value)
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(event: IpcMainInvokeEvent, code: string, ...args: any[]): Promise<any> | any {
    const fun = this.handlerMap.get(code)
    if (fun) return fun(event, ...args)
    else utils.logger.logger.error(`${code} 处理器未注入`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandleFunction = (...args: any[]) => Promise<any> | any

export default HandleHandler
