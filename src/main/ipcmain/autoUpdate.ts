import { autoUpdateUtil } from '@main/utils'
import { DOWNLOAD_UPDATE, INSTALL_UPDATE, CHECK_UPDATE } from '@common/constants'

export const autoUpdateHandleHandlerArr = [
  {
    code: CHECK_UPDATE,
    handler: autoUpdateUtil.checkUpdate
  }
]

export const autoUpdateOnHandlerArr = [
  {
    code: DOWNLOAD_UPDATE,
    handler: autoUpdateUtil.downloadUpdate
  },
  {
    code: INSTALL_UPDATE,
    handler: autoUpdateUtil.installUpdate
  }
]
