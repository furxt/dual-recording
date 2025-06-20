import type { VoidFunction, HandleFunction } from './handler'
import { autoUpdate } from '@main/utils'
import { DOWNLOAD_UPDATE, INSTALL_UPDATE, CHECK_UPDATE } from '@constants/index'

export const autoUpdateHandleHandlerMap = new Map<string, HandleFunction>([
  [CHECK_UPDATE, autoUpdate.autoUpdateApp]
])

export const autoUpdateOnHandlerMap = new Map<string, VoidFunction>([
  [DOWNLOAD_UPDATE, autoUpdate.downloadUpdate],
  [INSTALL_UPDATE, autoUpdate.installUpdate]
])
