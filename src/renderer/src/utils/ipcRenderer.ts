export const send = (code: string, ...args: unknown[]): void => {
  window.electron.ipcRenderer.send('common-on', code, ...args)
}

export function invoke<T>(code: string, ...args: unknown[]): Promise<T> {
  return window.electron.ipcRenderer.invoke('common-handle', code, ...args)
}

export default { send, invoke }
