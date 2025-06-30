import { IpcMainInvokeEvent } from 'electron'
import { commonHandleHandlerArr, commonOnHandlerArr } from './common'
import { autoUpdateOnHandlerArr, autoUpdateHandleHandlerArr } from './autoUpdate'
import { videoHandleHandlerArr } from './saveVideo'
import { uploadFileHandleHandlerArr } from './uploadFile'
import { logger } from '@main/utils/logger'

// on的处理器Map, 有新的处理器自行追加即可
const onHandlerArr = [...autoUpdateOnHandlerArr, ...commonOnHandlerArr]

// handle的处理器Map, 有新的处理器自行追加即可
const handleHandlerArr = [
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

  initHandler(
    handlerArr: { code: string; handler: HandleFunction | VoidFunction }[],
    handlerMap: Map<string, HandleFunction | VoidFunction>
  ): void {
    handlerArr.forEach((e) => {
      handlerMap.set(e.code, e.handler)
    })
    handlerArr.length = 0
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(event: IpcMainInvokeEvent, code: string, ...args: any[]): Promise<any> | any {
    const fun = this.handelHandlerMap.get(code)
    if (fun) return fun(event, ...args)
    else logger.error(`${code} 处理器未注入`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: IpcMainInvokeEvent, code: string, ...args: any[]): void {
    const fun = this.onHandlerMap.get(code)
    if (fun) fun(event, ...args)
    else logger.error(`${code} 处理器未注入`)
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HandleFunction = (...args: any[]) => Promise<any> | any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VoidFunction = (...args: any[]) => void

export default new Handler()
