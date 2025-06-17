import { Conf } from 'electron-conf/main'

export const localConf = new Conf()
export const WINDOW_SIZE = 'windowSize'
export const FFMPEG_HOME_PATH = 'ffmpegHomePath'

export default {
  localConf,
  WINDOW_SIZE,
  FFMPEG_HOME_PATH
}
