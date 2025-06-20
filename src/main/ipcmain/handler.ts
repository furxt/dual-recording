import { IpcMainInvokeEvent } from 'electron'
import { commonHandleHandlerMap, commonOnHandlerMap } from './common'
import { autoUpdateHandleHandlerMap, autoUpdateOnHandlerMap } from './autoUpdate'
import { logHandleHandlerMap } from './logger'
import { videoHandleHandlerMap } from './saveVideo'
import { uploadFileHandleHandlerMap } from './uploadFile'
import utils from '@main/utils'

class Handler {
  private handelHandlerMap = new Map<string, HandleFunction>()
  private onHandlerMap = new Map<string, VoidFunction>()

  constructor() {
    this.initHandleHandler()
    this.initOnHandler()
  }

  /**
   * 初始化handleHandler
   */
  initHandleHandler(): void {
    const handlerMapArr = [
      commonHandleHandlerMap,
      autoUpdateHandleHandlerMap,
      logHandleHandlerMap,
      videoHandleHandlerMap,
      uploadFileHandleHandlerMap
    ]
    handlerMapArr.forEach((handlerMap) => {
      handlerMap.forEach((value, key) => {
        this.handelHandlerMap.set(key, value)
      })
    })
  }

  /**
   * 初始化onHandler
   */
  initOnHandler(): void {
    const handlerMapArr = [autoUpdateOnHandlerMap, commonOnHandlerMap]
    handlerMapArr.forEach((handlerMap) => {
      handlerMap.forEach((value, key) => {
        this.onHandlerMap.set(key, value)
      })
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(event: IpcMainInvokeEvent, code: string, ...args: any[]): Promise<any> | any {
    const fun = this.handelHandlerMap.get(code)
    if (fun) return fun(event, ...args)
    else utils.logger.logger.error(`${code} 处理器未注入`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: IpcMainInvokeEvent, code: string, ...args: any[]): void {
    const fun = this.onHandlerMap.get(code)
    if (fun) fun(event, ...args)
    else utils.logger.logger.error(`${code} 处理器未注入`)
  }

  /**
   * 卸载处理器
   * @param type 处理器类型: 'handle' | 'on'
   * @param code 处理器代码
   */
  unregisterHandler(type: 'handle' | 'on', code: string): void {
    if (type === 'on') this.onHandlerMap.delete(code)
    else this.handelHandlerMap.delete(code)
  }

  /**
   * 注册处理器
   * @param type 处理器类型: 'handle' | 'on'
   * @param code 处理器代码
   * @param fun 处理器函数
   */
  registerHandler(type: 'handle' | 'on', code: string, fun: HandleFunction | VoidFunction): void {
    if (type === 'on') this.onHandlerMap.set(code, fun)
    else this.handelHandlerMap.set(code, fun)
  }
}

const handler = new Handler()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HandleFunction = (...args: any[]) => Promise<any> | any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VoidFunction = (...args: any[]) => void

export default handler
