import { autoUpdateUtil } from '@main/utils'
import { DOWNLOAD_UPDATE, INSTALL_UPDATE, CHECK_UPDATE } from '@common/constants'
import type { OnHandler, HandleHandler } from './handler'

export const autoUpdateHandleHandlerArr: HandleHandler[] = [
  {
    code: CHECK_UPDATE,
    handler: autoUpdateUtil.checkUpdate
  }
]

export const autoUpdateOnHandlerArr: OnHandler[] = [
  {
    code: DOWNLOAD_UPDATE,
    handler: autoUpdateUtil.downloadUpdate
  },
  {
    code: INSTALL_UPDATE,
    handler: autoUpdateUtil.installUpdate
  }
]
