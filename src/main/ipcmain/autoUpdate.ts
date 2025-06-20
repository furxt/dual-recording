import type { HandleFunction } from './handler'
import { autoUpdate } from '@main/utils'
import { DOWNLOAD_UPDATE, INSTALL_UPDATE, CHECK_UPDATE } from '@constants/index'

export const autoUpdateHandleHandlerMap = new Map<string, HandleFunction>([
  [CHECK_UPDATE, autoUpdate.autoUpdateApp]
])

export const autoUpdateHandleHandlerArr = [
  {
    code: CHECK_UPDATE,
    handler: autoUpdate.autoUpdateApp
  }
]

export const autoUpdateOnHandlerArr = [
  {
    code: DOWNLOAD_UPDATE,
    handler: autoUpdate.downloadUpdate
  },
  {
    code: INSTALL_UPDATE,
    handler: autoUpdate.installUpdate
  }
]
