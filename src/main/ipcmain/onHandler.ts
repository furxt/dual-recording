import { IpcMainInvokeEvent } from 'electron'
import utils from '@main/utils'
import { autoUpdateOnHandlerMap } from './autoUpdate'
import { commonOnHandlerMap } from './common'

class OnHandler {
  private handlerMap = new Map<string, VoidFunction>()

  constructor() {
    this.init()
  }

  init(): void {
    const handlerArrMap = [autoUpdateOnHandlerMap, commonOnHandlerMap]
    handlerArrMap.forEach((handlerMap) => {
      handlerMap.forEach((value, key) => {
        this.handlerMap.set(key, value)
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: IpcMainInvokeEvent, code: string, ...args: any[]): void {
    const fun = this.handlerMap.get(code)
    if (fun) fun(event, ...args)
    else utils.logger.logger.error(`${code} 处理器未注入`)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VoidFunction = (...args: any[]) => void

export default OnHandler
