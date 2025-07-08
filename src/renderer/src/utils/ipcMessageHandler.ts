class IpcMessageHandler {
  // 页面通信代码
  private pageCode: string

  // 具体的事件处理器
  private handlerMap: Map<string, IpcMsgHandler>

  constructor(pageCode: string, handlerMap: Map<string, IpcMsgHandler>) {
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
