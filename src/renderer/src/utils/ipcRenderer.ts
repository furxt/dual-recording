export const send = (code: string, ...args: unknown[]): void => {
  window.electron.ipcRenderer.send('common-on', code, ...args)
}

export const invoke = (code: string, ...args: unknown[]): Promise<unknown> => {
  return window.electron.ipcRenderer.invoke('common-handle', code, ...args)
}

export default { send, invoke }
