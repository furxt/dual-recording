import { Conf } from 'electron-conf/main'

const localConf = new Conf()
localConf.registerRendererListener()

const FFMPEG_HOME_PATH = 'ffmpegHomePath'

export { localConf, FFMPEG_HOME_PATH }
export default {
  localConf,
  FFMPEG_HOME_PATH
}
