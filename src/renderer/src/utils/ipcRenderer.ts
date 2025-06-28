export const send = (code: string, ...args: any[]): void => {
  window.electron.ipcRenderer.send('common-on', code, ...args)
}

export const invoke = (code: string, ...args: any[]): Promise<any> => {
  return window.electron.ipcRenderer.invoke('common-handle', code, ...args)
}

export default { send, invoke }
