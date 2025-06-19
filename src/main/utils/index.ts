import * as autoUpdate from './autoUpdate'
import * as common from './common'
import * as ffmpeg from './ffmpeg'
import FileWriter from './fileWriter'
import * as globalConf from './globalConf'
import * as logger from './logger'
import * as send from './send'
import * as tray from './tray'
import * as window from './window'

export { autoUpdate, common, ffmpeg, globalConf, logger, tray, window, FileWriter, send }

const utils = { autoUpdate, common, ffmpeg, globalConf, logger, tray, window, FileWriter, send }

export default utils
