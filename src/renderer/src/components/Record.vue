<template>
  <el-dialog v-model="dialogSettingVisible" title="设置" width="400" :close-on-click-modal="false">
    <el-form :model="settingForm">
      <el-form-item label="麦克风">
        <el-select
          v-model="settingForm.audioinputLabel"
          placeholder="请选择"
          @change="changeAudioInput"
        >
          <el-option
            v-for="(item, index) in audioinputDevices"
            :key="`${index}`"
            :label="item.label"
            :value="item.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="摄像头">
        <el-select
          v-model="settingForm.videoinputLabel"
          placeholder="请选择"
          @change="changeVideoInput"
        >
          <el-option
            v-for="(item, index) in videoinputDevices"
            :key="`${index}`"
            :label="item.label"
            :value="item.label"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </el-dialog>

  <div class="flex flex-col items-center">
    <div class="flex items-center justify-center">
      <el-progress
        :style="progressStyle"
        :percentage="transCodeProgress"
        :stroke-width="3"
        :color="progressConstant.colors"
        :text-inside="true"
        striped
        striped-flow
        :duration="10"
      />
    </div>
    <!-- 视频区域 -->
    <div
      class="video-container relative"
      :style="{ width: `${videoConfig.width}px`, height: `${videoConfig.height}px` }"
    >
      <!-- Video -->
      <video
        ref="videoRef"
        autoplay
        playsinline
        :muted="disableReplayBtn"
        :controls="showControls"
        class="absolute inset-0 w-full h-full object-contain"
      />

      <!-- Canvas 永远覆盖在 video 上 -->
      <canvas
        v-show="isRecording"
        ref="canvasRef"
        class="overlay-canvas absolute inset-0 w-full h-full"
      />

      <!-- 录制红点 -->
      <div v-if="showRed" class="recording-indicator absolute top-3 right-3" />

      <!-- 提示层 -->
      <div v-if="isPaused" class="overlay-message absolute-center">当前录制已暂停</div>
      <div class="absolute-center">
        <el-progress
          v-if="showUploadProgress"
          type="dashboard"
          :percentage="percentage"
          :color="progressConstant.colors"
        />
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="pt-3 w-full px-2">
      <div class="flex gap-3 items-center justify-center flex-wrap">
        <el-button
          type="primary"
          :disabled="disableSettingBtn"
          :icon="Setting"
          @click="openSettingDialog"
        >
          设置
        </el-button>

        <el-button type="primary" :disabled="disableStartBtn" :icon="Video" @click="startRecording">
          开始
        </el-button>

        <el-button
          v-if="!disablePauseBtn || disableResumeBtn"
          type="primary"
          :disabled="disablePauseBtn"
          :icon="PauseOne"
          @click="pauseRecording"
        >
          暂停
        </el-button>
        <el-button
          v-else
          type="primary"
          :disabled="disableResumeBtn"
          :icon="GoAhead"
          @click="resumeRecording"
        >
          继续
        </el-button>

        <el-button type="primary" :disabled="disableStopBtn" :icon="Logout" @click="stopRecording">
          结束
        </el-button>

        <el-button type="primary" :disabled="disableUploadBtn" :icon="Upload" @click="upload">
          上传
        </el-button>
      </div>
    </div>
  </div>

  <!-- 设置弹窗保持不变 -->
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { dayjs } from 'element-plus'
import { GoAhead, Logout, PauseOne, Setting, Upload, Video } from '@icon-park/vue-next'
import { useGlobalConfigStore } from '@renderer/stores'
import { progressConstant } from '@renderer/constants'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'
import type { NotificationHandle } from 'element-plus'
import {
  RELAUNCH,
  SAVE_CHUNK,
  REPAIR_VIDEO,
  UPLOAD_FILE,
  RECORD_PAGE,
  CHANGE_RESOLUTION,
  UPDATE_UPLOAD_PROGRESS,
  TRANSCODE_COMPLETE,
  TRANSCODE_PROGRESS,
  CONF_WINDOW_SIZE,
  RECORD_LOG
} from '@common/constants'
import { Conf } from 'electron-conf/renderer'
import { IpcMessageHandler, ipcRendererUtil } from '@renderer/utils'
import { envUtil } from '@common/utils'
import { IpcRendererEvent } from 'electron/renderer'

const conf = new Conf()
const showTransCodeProgress = ref(false)
const transCodeProgress = ref(0)
const replayTextFlag = ref(true)

const changeResolution = (): void => {
  if (isRecording.value) {
    ElNotification({
      title: '分辨率',
      message: '修改成功，重启即可生效',
      type: 'primary',
      customClass: 'small-notification'
    })
  } else {
    ElMessageBox.confirm('分辨率修改成功，马上重启即可生效，确认吗?', '提醒', {
      closeOnClickModal: false,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'primary'
    })
      .then(() => {
        ipcRendererUtil.send(RELAUNCH)
      })
      .catch(() => {})
  }
}

let notification: NotificationHandle | undefined
const transcodeComplete = (): void => {
  transCodeProgress.value = 100
  setTimeout(() => {
    showTransCodeProgress.value = false
    transCodeProgress.value = 0
    disableUploadBtn.value = false
    notification = ElNotification({
      duration: 0,
      title: '转码成功',
      message: '可以开始上传了',
      type: 'success',
      customClass: 'small-notification'
    })
  }, 500)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IpcMessageHandlerMap = new Map<string, (...data: any[]) => void | Promise<void>>([
  [CHANGE_RESOLUTION, changeResolution],
  [
    UPDATE_UPLOAD_PROGRESS,
    (_event: IpcRendererEvent, index: number, total: number) => {
      percentage.value = index === total ? 99 : Math.floor((index / total) * 100)
    }
  ],
  [TRANSCODE_COMPLETE, transcodeComplete],
  [
    TRANSCODE_PROGRESS,
    (_event: IpcRendererEvent, transCodeProgressVal: number) => {
      transCodeProgress.value = transCodeProgressVal
    }
  ]
])

const ipcMessageHandler = new IpcMessageHandler(RECORD_PAGE, IpcMessageHandlerMap)

const globalConfigStore = useGlobalConfigStore()

const percentage = ref(0)

// DOM 引用
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const showRed = ref(false)
const showUploadProgress = ref(false)
const localFilePath = ref('')

// 状态管理
const isRecording = ref(false)
const isPaused = ref(false)

let canvasStream: MediaStream | null = null
let mediaStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let animationFrameId: number | null = null

const disableReplayBtn = ref(true)
const disableSettingBtn = ref(false)
const disableStartBtn = ref(false)
const disableStopBtn = ref(true)
const disablePauseBtn = ref(true)
const disableResumeBtn = ref(true)
const disableUploadBtn = ref(true)
const showControls = ref(false)

const dialogSettingVisible = ref(false)
const settingForm = ref({
  videoinputLabel: '',
  audioinputLabel: ''
})

const videoinputDevices = ref<MediaDeviceInfo[]>([])
const audioinputDevices = ref<MediaDeviceInfo[]>([])

const videoConfig = ref({
  width: 0,
  height: 0,
  aspectRatio: 1.777
})

const loadDevices = async (): Promise<void> => {
  const devices = await navigator.mediaDevices.enumerateDevices()
  videoinputDevices.value.length = 0
  audioinputDevices.value.length = 0
  devices.forEach(async (device) => {
    if (device.kind === 'videoinput') {
      videoinputDevices.value.push(device)
    } else if (device.kind === 'audioinput') {
      audioinputDevices.value.push(device)
    }
  })
}

// 使用 computed 创建计算属性
const progressStyle = computed(() => {
  return {
    visibility: showTransCodeProgress.value ? 'visible' : 'hidden',
    width: `${videoConfig.value.width}px`
  }
})

onUnmounted(() => {
  ipcMessageHandler.destroyed()
})

onMounted(async () => {
  // 这里获取当前录制的视频分辨率，以便调整窗口大小
  const windowSizeInfo = (await conf.get(CONF_WINDOW_SIZE)) as WindowSizeInfo
  console.log('windowSizeInfo', windowSizeInfo)
  const {
    resolution: { width, height }
  } = windowSizeInfo
  const aspectRatio = +(width / height).toFixed(3)
  videoConfig.value = { aspectRatio, width, height }
  console.log(videoConfig.value)

  // 如果store里面没有视频设备和音频设备信息, 就去配置文件读取
  if (!globalConfigStore.config.videoinputDeviceId) {
    globalConfigStore.config.videoinputDeviceId = envUtil.RENDERER_VITE_VIDEO_INPUT
  }
  if (!globalConfigStore.config.audioinputDeviceId) {
    globalConfigStore.config.audioinputDeviceId = envUtil.RENDERER_VITE_AUDIO_INPUT
  }

  await loadDevices()
  console.log(videoinputDevices.value, audioinputDevices.value)
  console.log(
    globalConfigStore.config.audioinputDeviceId,
    globalConfigStore.config.videoinputDeviceId
  )

  // 防止设备已经被拔出, 就清空掉原来的设备信息
  if (globalConfigStore.config.videoinputDeviceId) {
    console.log('videoinputDeviceId', globalConfigStore.config.videoinputDeviceId)
    const videoinputDevice = videoinputDevices.value.find(
      (e) => e.deviceId === globalConfigStore.config.videoinputDeviceId
    )
    console.log('初始化的videoinputDevice', videoinputDevice)
    if (!videoinputDevice) {
      globalConfigStore.config.videoinputDeviceId = null
    } else {
      settingForm.value.videoinputLabel = videoinputDevice.label
    }
  }
  if (globalConfigStore.config.audioinputDeviceId) {
    const audioinputDevice = audioinputDevices.value.find(
      (e) => e.deviceId === globalConfigStore.config.audioinputDeviceId
    )
    console.log('初始化的audioinputDevice', audioinputDevice)
    if (!audioinputDevice) {
      globalConfigStore.config.audioinputDeviceId = null
    } else {
      settingForm.value.audioinputLabel = audioinputDevice.label
    }
  }

  console.log('默认的设备配置', settingForm.value)
})

// 🔥 页面卸载前释放所有资源
onBeforeUnmount(() => {
  // 停止动画帧请求
  if (!animationFrameId) {
    cancelAnimationFrame(animationFrameId as unknown as number)
  }

  // 如果正在录制，则停止录制
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }

  // 停止 canvas 流
  if (canvasStream) {
    canvasStream.getTracks().forEach((track) => track.stop())
  }

  // 停止原始摄像头流
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }

  // 取消定时任务
  if (animationIntervalId) {
    clearTimeout(animationIntervalId)
    animationIntervalId = undefined
  }
})

let lastUpdateTime = 0
let beginTime = ''
const FRAME_RATE = 30 // 目标帧率，例如 30fps
const FRAME_INTERVAL = 1000 / FRAME_RATE // 每帧间隔时间（ms）
let lastDisplayedTime = dayjs().format('YYYY-MM-DD HH:mm:ss') // 初始化为当前时间

const drawOverlay = (timestamp: number): void => {
  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas) {
    console.warn('Video or Canvas is not available')
    return
  }

  const ctx = canvas.getContext('2d')

  // 视频尚未准备好，暂停绘制
  if (video.readyState < 2) {
    return
  }

  // 设置 canvas 和视频尺寸一致
  canvas.width = videoConfig.value.width
  canvas.height = videoConfig.value.height
  if (ctx) {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // 计算缩放比例，保持原始视频比例不变
    const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight)
    const x = canvas.width / 2 - (video.videoWidth / 2) * scale
    const y = canvas.height / 2 - (video.videoHeight / 2) * scale
    // 绘制当前帧到 canvas 上
    ctx.drawImage(video, x, y, video.videoWidth * scale, video.videoHeight * scale)

    // 实时时间戳更新（每秒一次）
    const currentTime =
      timestamp - lastUpdateTime >= 950 ? dayjs().format('YYYY-MM-DD HH:mm:ss') : lastDisplayedTime
    if (currentTime !== lastDisplayedTime) {
      lastUpdateTime = timestamp
      lastDisplayedTime = currentTime
    }

    ctx.fillStyle = 'rgba(28, 31, 33, 0.7)'
    ctx.font = '18px Arial'
    ctx.fillText('© Watermark Text', x + 2, 20)
    ctx.fillText(beginTime, x + 2, 45)
    ctx.fillText(lastDisplayedTime, x + 2, 70)
  }
}

// 保存 chunk 到 本地文件夹
const saveChunkToDB = async (
  blob: Blob | undefined,
  uuid: string,
  chunkId: number
): Promise<void> => {
  let arrayBuffer: ArrayBuffer | undefined = await blob?.arrayBuffer()
  await ipcRendererUtil.invoke(SAVE_CHUNK, {
    buffer: arrayBuffer,
    uuid,
    chunkId
  })
  blob = undefined
  arrayBuffer = undefined
}

const startRecording = async (): Promise<void> => {
  if (isRecording.value) return
  const result = await reloadDevice()
  if (!result) return

  notification?.close()
  globalConfigStore.isRecording = true
  setTimeout(() => {
    disableStopBtn.value = false
    disablePauseBtn.value = false
  }, 1100)
  replayTextFlag.value = true
  showControls.value = false
  disableReplayBtn.value = true
  disableUploadBtn.value = true
  disableStartBtn.value = true
  disableSettingBtn.value = true
  isRecording.value = true
  showRed.value = true
  isPaused.value = false
  beginTime = dayjs().format('YYYY-MM-DD HH:mm:ss')

  // 获取原始音视频轨道
  // const videoTrack = mediaStream.getVideoTracks()[0]
  const audioTrack = mediaStream!.getAudioTracks()[0]

  // 获取 canvas 流
  if (canvasRef.value) {
    canvasStream = canvasRef.value.captureStream(FRAME_RATE) // 10fps
  }
  const newVideoTrack = canvasStream?.getVideoTracks()[0]

  // 创建混合流：canvas 视频 + 原始音频
  const mixedStream = new MediaStream()
  mixedStream.addTrack(newVideoTrack!)
  if (audioTrack) {
    mixedStream.addTrack(audioTrack.clone())
  }

  // 初始化 MediaRecorder
  let chunkId = 0
  const uuid = uuidv4().replace(/-/g, '')
  const pendingSaves: Promise<void>[] = [] // 跟踪未完成的保存任务
  // 设置比特率和编码
  const options = {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2 * 1024 * 1024 // 2 Mbps
  }
  mediaRecorder = new MediaRecorder(mixedStream, options)

  mediaRecorder.ondataavailable = async (event: BlobEvent) => {
    if (event.data.size > 0) {
      const savePromise = saveChunkToDB(event.data, uuid, chunkId++)
      pendingSaves.push(savePromise)
    }
  }

  mediaRecorder.onstop = async () => {
    try {
      // 等待所有 pending 的保存任务完成
      await Promise.all(pendingSaves)
      pendingSaves.length = 0
      showTransCodeProgress.value = true
      const { success, message, data, error } = (await ipcRendererUtil.invoke(REPAIR_VIDEO, {
        uuid
      })) as Result<string>

      loading?.close()
      loading = undefined

      if (success) {
        ElMessage.success(message)
        console.log(data)
        localFilePath.value = data!
        disableReplayBtn.value = false

        showControls.value = true
        videoRef.value!.src = `file:///${localFilePath.value}`
        // videoRef.value!.src = `${CUSTOM_PROTOCOL}://video/${encodeURIComponent(localFilePath.value)}`
        setTimeout(() => {
          videoRef.value!.pause()
        }, 500)
      } else {
        ElMessage.error(error)
      }
    } catch (err) {
      loading?.close()
      loading = undefined
      console.error('视频保存失败!', err)
      ElMessage.error('视频保存失败!')
    } finally {
      // 清理资源
      mixedStream.getTracks().forEach((track) => track.stop())
    }
  }

  mediaRecorder.start(1000 * 30)
  startDrawLoop()
}

let animationIntervalId: TimerId | undefined
const startDrawLoop = (): void => {
  const loop = (): void => {
    drawOverlay(performance.now())
    animationIntervalId = setTimeout(loop, FRAME_INTERVAL) // 更可控
  }
  loop()
}

// 切换播放/暂停状态
const togglePlay = (): void => {
  const video = videoRef.value
  if (video?.paused) {
    video.play()
  } else {
    video?.pause()
  }
}

const pauseRecording = (): void => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause()
    clearTimeout(animationIntervalId as TimerId)
    togglePlay()
    disablePauseBtn.value = true
    disableResumeBtn.value = false
    showRed.value = false
    isPaused.value = true
  }
}

const resumeRecording = (): void => {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    disablePauseBtn.value = false
    disableResumeBtn.value = true
    showRed.value = true
    isPaused.value = false
    mediaRecorder.resume()
    startDrawLoop()
    togglePlay()
  }
}

let loading: LoadingInstance | undefined
const stopRecording = (): void => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    loading = ElLoading.service({
      lock: true,
      text: '正在保存视频, 请稍后!'
    })
    globalConfigStore.isRecording = false
    disableSettingBtn.value = false
    disableStopBtn.value = true
    disableResumeBtn.value = true
    disablePauseBtn.value = true
    showRed.value = false
    disableStartBtn.value = false
    isRecording.value = false
    mediaRecorder.stop()
    isPaused.value = false

    clearTimeout(animationIntervalId as TimerId)
    animationIntervalId = undefined

    // ✅ 恢复原始视频流
    if (videoRef.value) {
      videoRef.value.srcObject = null
    }
    // ✅ 停止 video 流
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    // ✅ 停止 canvas 流
    if (canvasStream) {
      canvasStream.getTracks().forEach((track) => track.stop())
      canvasStream = null
    }
  }
}

const upload = async (): Promise<void> => {
  disableUploadBtn.value = true
  showUploadProgress.value = true
  disableSettingBtn.value = true
  disableReplayBtn.value = true
  disableStartBtn.value = true
  disableStopBtn.value = true
  disablePauseBtn.value = true
  disableResumeBtn.value = true
  disableUploadBtn.value = true
  showUploadProgress.value = true
  loading = ElLoading.service({
    lock: true,
    background: 'rgba(0, 0, 0, 0.2)', // 黑色半透明背景
    customClass: 'transparent-loading' // 自定义类名
  })
  const { success } = (await ipcRendererUtil.invoke(
    UPLOAD_FILE,
    localFilePath.value
  )) as Result<void>

  notification?.close()
  notification = undefined
  loading?.close()
  loading = undefined

  if (success) percentage.value = 100

  setTimeout(() => {
    showUploadProgress.value = false
    percentage.value = 0
    disableStartBtn.value = false
    disableSettingBtn.value = false
    if (success) {
      ElMessage.success('上传成功')
      disableReplayBtn.value = false
    } else {
      ElMessage.error('上传失败')
      disableUploadBtn.value = false
    }
  }, 500)
}

const openSettingDialog = async (): Promise<void> => {
  dialogSettingVisible.value = true
  await loadDevices()
}

const changeVideoInput = (val: string): void => {
  replayTextFlag.value = true
  const videoinputDevice = videoinputDevices.value.find((e) => e.label === val)
  globalConfigStore.config.videoinputDeviceId = videoinputDevice?.deviceId as string
  reloadDevice()
}

const changeAudioInput = (val: string): void => {
  replayTextFlag.value = true
  const audioinputDevice = audioinputDevices.value.find((e) => e.label === val)
  globalConfigStore.config.audioinputDeviceId = audioinputDevice?.deviceId as string
  reloadDevice()
}

const reloadDevice = async (): Promise<boolean> => {
  try {
    showControls.value = false
    const audio = globalConfigStore.config.audioinputDeviceId
      ? { deviceId: globalConfigStore.config.audioinputDeviceId }
      : true
    if (isRecording.value) return false

    // 停止旧的 mediaStream，避免摄像头资源被占用
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: {
        ...videoConfig.value,
        deviceId: globalConfigStore.config.videoinputDeviceId!
      }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
    return true
  } catch (error) {
    console.error('获取媒体设备失败:', error)
    ipcRendererUtil.send(RECORD_LOG, error)
    ElMessage.error('当前设备不可用, 请检查设备是否正常!')
    return false
  }
}
</script>

<style lang="scss">
.custom-progress .el-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}

.video-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto; // 自动左右外边距实现居中
}

video,
.overlay-canvas {
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.412);
}

.overlay-canvas {
  pointer-events: none;
}

.overlay-message {
  font-size: 24px;
  font-weight: bold;
  animation: blink 1500ms ease-in-out infinite;
  padding: 10px 20px;
  border-radius: 8px;
  pointer-events: none;
  z-index: 10;
  color: yellow;
}

.recording-indicator {
  width: 18px;
  height: 18px;
  background-color: red;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.small-notification .el-notification__icon {
  // 图标大小
  font-size: 12px !important;
}
</style>
