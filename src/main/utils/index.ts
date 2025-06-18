import * as autoUpdate from './autoUpdate'
import * as common from './common'
import * as ffmpeg from './ffmpeg'
import * as globalConf from './globalConf'
import * as logger from './logger'
import * as tray from './tray'
import * as window from './window'

export { autoUpdate, common, ffmpeg, globalConf, logger, tray, window }

const utils = { autoUpdate, common, ffmpeg, globalConf, logger, tray, window }

export default utils
