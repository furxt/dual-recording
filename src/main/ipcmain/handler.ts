import { IpcMainInvokeEvent } from 'electron'
import { commonHandleHandlerArr, commonOnHandlerArr } from './common'
import { autoUpdateOnHandlerArr, autoUpdateHandleHandlerArr } from './autoUpdate'
import { videoHandleHandlerArr } from './saveVideo'
import { uploadFileHandleHandlerArr } from './uploadFile'
import { logUtil } from '@main/utils'

// on的处理器Map, 有新的处理器自行追加即可
const onHandlerArr: OnHandler[] = [...autoUpdateOnHandlerArr, ...commonOnHandlerArr]

// handle的处理器Map, 有新的处理器自行追加即可
const handleHandlerArr: HandleHandler[] = [
  ...autoUpdateHandleHandlerArr,
  ...commonHandleHandlerArr,
  ...videoHandleHandlerArr,
  ...uploadFileHandleHandlerArr
]

class Handler {
  private handelHandlerMap = new Map<string, HandleFunction>()
  private onHandlerMap = new Map<string, VoidFunction>()

  constructor() {
    this.init()
  }

  init(): void {
    this.initHandler(onHandlerArr, this.onHandlerMap)
    this.initHandler(handleHandlerArr, this.handelHandlerMap)
  }

  initHandler<T extends VoidFunction | HandleFunction>(
    handlerArr: Array<{ code: string; handler: T }>,
    handlerMap: Map<string, T>
  ): void {
    handlerArr.forEach((e) => {
      handlerMap.set(e.code, e.handler)
    })
    handlerArr.length = 0
  }

  handle(event: IpcMainInvokeEvent, code: string, ...args: unknown[]): Promise<unknown> | unknown {
    const fun = this.handelHandlerMap.get(code)
    if (fun) return fun(event, ...args)
    else {
      const errMsg = `${code} handle处理器未注入`
      logUtil.error(errMsg)
      return Promise.reject(new Error(errMsg))
    }
  }

  on(event: IpcMainInvokeEvent, code: string, ...args: unknown[]): void {
    const fun = this.onHandlerMap.get(code)
    if (fun) fun(event, ...args)
    else logUtil.error(`${code} on处理器未注入`)
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

type HandleFunction = (...args: unknown[]) => Promise<unknown> | unknown
type VoidFunction = (...args: unknown[]) => void

export type OnHandler = {
  code: string
  handler: VoidFunction
}
export type HandleHandler = {
  code: string
  handler: HandleFunction
}

export default new Handler()
