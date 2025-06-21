import { Conf } from 'electron-conf/main'

const localConf = new Conf()
localConf.registerRendererListener()

const WINDOW_SIZE = 'windowSize'
const FFMPEG_HOME_PATH = 'ffmpegHomePath'

export { localConf, WINDOW_SIZE, FFMPEG_HOME_PATH }
export default {
  localConf,
  WINDOW_SIZE,
  FFMPEG_HOME_PATH
}
