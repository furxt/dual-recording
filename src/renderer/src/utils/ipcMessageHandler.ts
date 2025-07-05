class IpcMessageHandler {
  private pageCode: string

  private handlerMap: Map<string, (...data: unknown[]) => void | Promise<void>>

  constructor(
    pageCode: string,
    handlerMap: Map<string, (...data: unknown[]) => void | Promise<void>>
  ) {
    this.pageCode = pageCode
    this.handlerMap = handlerMap
    this.init()
  }

  init(): void {
    window.electron.ipcRenderer.on(this.pageCode, (event, code: string, ...data) => {
      console.log('收到主进程的消息', event, code, data)
      if (this.handlerMap.has(code)) {
        this.handlerMap.get(code)!(event, ...data)
      } else {
        console.log(`${this.pageCode} 没有 ${code} 的handler`)
      }
    })
  }

  destroyed(): void {
    window.electron.ipcRenderer.removeAllListeners(this.pageCode)
  }
}

export default IpcMessageHandler
