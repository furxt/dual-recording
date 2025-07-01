class IpcMessageHandler {
  private pageCode: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlerMap: Map<string, (...data: any[]) => void | Promise<void>>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(pageCode: string, handlerMap: Map<string, (...data: any[]) => void | Promise<void>>) {
    this.pageCode = pageCode
    this.handlerMap = handlerMap
    this.init()
  }

  init(): void {
    window.electron.ipcRenderer.on(this.pageCode, (_event, code, ...data) => {
      if (this.handlerMap.has(code)) {
        this.handlerMap.get(code)!(...data)
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
