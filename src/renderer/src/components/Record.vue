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
            :label="item.label"
            :value="item.label"
            :key="index"
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
            :label="item.label"
            :value="item.label"
            :key="index"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <!-- <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogSettingVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogSettingVisible = false">确认</el-button>
      </div>
    </template> -->
  </el-dialog>
  <div class="flex flex-col items-center">
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
      <div
        v-if="isPaused"
        class="overlay-message absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
      >
        当前录制已暂停
      </div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <el-progress
          v-if="showUploadProgress"
          type="dashboard"
          :percentage="percentage"
          :color="colors"
        />
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="pt-3 w-full px-2">
      <div class="flex gap-3 items-center justify-center flex-wrap">
        <!-- 你的按钮保持不变 -->
        <el-button
          color="#7c3aed"
          type="primary"
          :disabled="disableStartBtn"
          @click="startRecording"
          :icon="Video"
        >
          开始
        </el-button>
        <el-button
          color="#7c3aed"
          type="primary"
          :disabled="disableStopBtn"
          @click="stopRecording"
          :icon="Logout"
        >
          结束
        </el-button>
        <el-button
          color="#7c3aed"
          type="primary"
          :disabled="disablePauseBtn"
          @click="pauseRecording"
          :icon="PauseOne"
        >
          暂停
        </el-button>
        <el-button
          color="#7c3aed"
          type="primary"
          :disabled="disableResumeBtn"
          @click="resumeRecording"
          :icon="GoAhead"
        >
          继续
        </el-button>
        <el-button
          color="#7c3aed"
          :disabled="disableReplayBtn"
          type="primary"
          @click="replay"
          :icon="ReplayMusic"
        >
          回放
        </el-button>
        <el-button
          type="primary"
          color="#7c3aed"
          :disabled="disableUploadBtn"
          @click="upload"
          :icon="Upload"
        >
          上传
        </el-button>
      </div>
      <div class="flex items-center justify-center pt-3">
        <el-button
          type="primary"
          :disabled="disableSettingBtn"
          color="#7c3aed"
          @click="openSettingDialog"
          :icon="Setting"
        >
          设置
        </el-button>
      </div>
    </div>
  </div>

  <!-- 设置弹窗保持不变 -->
</template>

<script setup>
import { v4 as uuidv4 } from 'uuid'
import { dayjs } from 'element-plus'
import { GoAhead, Logout, PauseOne, ReplayMusic, Setting, Upload, Video } from '@icon-park/vue-next'
import { useGlobalConfigStore } from '@renderer/stores'

window.electron.ipcRenderer.on('change-resolution', () => {
  if (isRecording.value) {
    ElNotification({
      title: '分辨率',
      message: '修改成功，重启即可生效',
      type: 'primary',
      customClass: 'small-notification'
    })
  } else {
    ElMessageBox.confirm('分辨率修改成功，马上重启即可生效，确认吗?', '提醒', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'primary'
    })
      .then(() => {
        window.electron.ipcRenderer.send('relaunch')
      })
      .catch(() => {})
  }
})

window.electron.ipcRenderer.on('update-upload-progress', (_event, data) => {
  const { index, total } = data
  percentage.value = Math.floor((index / total) * 100)
  // if (index === total) {
  //   showUploadProgress.value = false
  //   percentage.value = 0
  // }
})

window.electron.ipcRenderer.on('transcode-complete', () => {
  ElNotification({
    duration: 0,
    title: '转码成功',
    message: '可以开始上传了',
    type: 'success',
    customClass: 'small-notification'
  })
  disableUploadBtn.value = false
})

const globalConfigStore = useGlobalConfigStore()

const percentage = ref(0)
const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 }
]

// DOM 引用
const videoRef = ref(null)
const canvasRef = ref(null)
const showRed = ref(false)
const showUploadProgress = ref(false)
const localFilePath = ref('')

// 状态管理
const isRecording = ref(false)
const isPaused = ref(false)

let canvasStream = null
let mediaStream = null
let mediaRecorder = null
let animationFrameId = null

const disableReplayBtn = ref(true)
const disableSettingBtn = ref(false)
const disableStartBtn = ref(false)
const disableStopBtn = ref(true)
const disablePauseBtn = ref(true)
const disableResumeBtn = ref(true)
const disableUploadBtn = ref(true)
const showControls = ref(false)

const dialogSettingVisible = ref(false)
const settingForm = ref({})

const videoinputDevices = ref([])
const audioinputDevices = ref([])

const videoConfig = ref({
  width: 0,
  height: 0,
  aspectRatio: 1.777
})

const loadDevices = async () => {
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

onMounted(async () => {
  const { width, height } = await window.electron.ipcRenderer.invoke('get-video-config')
  const aspectRatio = +(width / height).toFixed(3)
  videoConfig.value = { aspectRatio, width, height }
  await loadDevices()
  const videoinputDevice = videoinputDevices.value.find(
    (e) => e.deviceId === globalConfigStore.config.videoinputDeviceId
  )
  if (!videoinputDevice) {
    globalConfigStore.config.videoinputDeviceId = null
  }
  const audioinputDevice = audioinputDevices.value.find(
    (e) => e.deviceId === globalConfigStore.config.audioinputDeviceId
  )
  if (!audioinputDevice) {
    globalConfigStore.config.audioinputDeviceId = null
  }

  const audio = globalConfigStore.config.audioinputDeviceId
    ? { deviceId: globalConfigStore.config.audioinputDeviceId }
    : true

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: { ...videoConfig.value, deviceId: globalConfigStore.config.videoinputDeviceId }
    })
    const tracks = mediaStream.getTracks()
    tracks.forEach((track) => {
      const { kind } = track // 'audio' 或 'video'
      if (kind === 'video') settingForm.value.videoinputLabel = track.label
      else if (kind === 'audio') settingForm.value.audioinputLabel = track.label
    })
  } catch (error) {
    console.error('获取媒体设备失败:', error)
  }

  if (!mediaStream) {
    ElMessage.error('无法访问摄像头或麦克风，请检查权限设置')
    return
  }
  videoRef.value.srcObject = mediaStream
})

// 🔥 页面卸载前释放所有资源
onBeforeUnmount(() => {
  // 停止动画帧请求
  if (!animationFrameId) {
    cancelAnimationFrame(animationFrameId)
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
    animationIntervalId = null
  }
})

// let lastBlinkTime = 0
// const blinkDuration = 1000 // 整个动画周期：600ms
let lastUpdateTime = 0
let beginTime
let frameCount = 0
const FRAME_RATE = 30 // 目标帧率，例如 30fps
const FRAME_INTERVAL = 1000 / FRAME_RATE // 每帧间隔时间（ms）
let lastDrawTime = performance.now()
let lastDisplayedTime = dayjs().format('YYYY-MM-DD HH:mm:ss') // 初始化为当前时间
// 新增一个数组用于存储时间戳映射
const frameTimestamps = []

function drawOverlay(timestamp) {
  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas) {
    console.warn('Video or Canvas is not available')
    return
  }

  // 控制帧率，防止过度绘制
  const now = timestamp
  // if (now - lastDrawTime < FRAME_INTERVAL - 1) {
  //   animationFrameId = requestAnimationFrame(drawOverlay)
  //   return
  // }
  // lastDrawTime = now

  const ctx = canvas.getContext('2d')

  // 视频尚未准备好，暂停绘制
  if (video.readyState < 2) {
    // animationFrameId = requestAnimationFrame(drawOverlay)
    return
  }

  // console.log(videoWidth, videoHeight, video.offsetWidth, video.offsetHeight)

  // 设置 canvas 和视频尺寸一致
  canvas.width = videoConfig.value.width
  canvas.height = videoConfig.value.height

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
    now - lastUpdateTime >= 1000 ? dayjs().format('YYYY-MM-DD HH:mm:ss') : lastDisplayedTime
  if (currentTime !== lastDisplayedTime) {
    lastUpdateTime = now
    lastDisplayedTime = currentTime
  }

  ctx.fillStyle = 'rgba(28, 31, 33, 0.7)'
  ctx.font = '18px Arial'
  ctx.fillText('© Watermark Text', x + 2, 20)
  ctx.fillText(beginTime, x + 2, 45)
  ctx.fillText(lastDisplayedTime, x + 2, 70)

  // ✅ 关键：继续请求下一帧，保持动画循环
  // animationFrameId = requestAnimationFrame(drawOverlay)

  // ✅ 增加帧计数器，可用于导出视频时计算 PTS/DTS
  // frameCount++

  // ✅ 新增：记录每帧的真实时间戳
  // frameTimestamps.push({
  //   frame: frameCount,
  //   pts: now, // 毫秒级时间戳
  //   isoTime: new Date().toISOString()
  //   // displayedTime: lastDisplayedTime
  // })
}

// 保存 chunk 到 本地文件夹
const saveChunkToDB = async (data, uuid, chunkId) => {
  const arrayBuffer = await data.arrayBuffer()

  await window.electron.ipcRenderer.invoke('save-chunk', {
    buffer: arrayBuffer,
    uuid,
    chunkId
  })
  arrayBuffer.length = 0
  frameTimestamps.length = 0
}

async function startRecording() {
  if (!mediaStream || isRecording.value) return

  await reloadDevice()

  setTimeout(() => {
    disableStopBtn.value = false
    disablePauseBtn.value = false
  }, 1200)
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
  const audioTrack = mediaStream.getAudioTracks()[0]

  // 获取 canvas 流
  canvasStream = canvasRef.value.captureStream(FRAME_RATE) // 10fps
  const newVideoTrack = canvasStream.getVideoTracks()[0]

  // 创建混合流：canvas 视频 + 原始音频
  const mixedStream = new MediaStream()
  mixedStream.addTrack(newVideoTrack)
  if (audioTrack) {
    mixedStream.addTrack(audioTrack.clone())
  }

  // 初始化 MediaRecorder
  let chunkId = 0
  const uuid = uuidv4().replace(/-/g, '')
  const pendingSaves = [] // 跟踪未完成的保存任务
  // 设置比特率和编码
  const options = {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 2 * 1024 * 1024 // 2 Mbps
  }
  mediaRecorder = new MediaRecorder(mixedStream, options)

  mediaRecorder.ondataavailable = async (e) => {
    if (e.data.size > 0) {
      const savePromise = saveChunkToDB(e.data, uuid, chunkId++)
      pendingSaves.push(savePromise)
    }
  }

  mediaRecorder.onstop = async () => {
    try {
      // 等待所有 pending 的保存任务完成
      await Promise.all(pendingSaves)
      pendingSaves.length = 0
      const { success, message, data, error } = await window.electron.ipcRenderer.invoke(
        'repair-video',
        {
          uuid
        }
      )
      if (loading) loading.close()
      if (success) {
        ElMessage.success(message)
        console.log(data)
        localFilePath.value = data
        disableReplayBtn.value = false
      } else {
        ElMessage.error(error)
      }
    } catch (err) {
      if (loading) loading.close()
      console.error('视频保存失败!', err)
      ElMessage.error('视频保存失败!')
    }

    // 清理资源
    mixedStream.getTracks().forEach((track) => track.stop())
  }

  mediaRecorder.start(1000 * 30)
  // drawOverlay(performance.now())
  startDrawLoop()
}

let animationIntervalId = null
function startDrawLoop() {
  const loop = () => {
    const now = performance.now()
    if (now - lastDrawTime >= FRAME_INTERVAL) {
      drawOverlay(now)
      lastDrawTime = now
    }
    animationIntervalId = setTimeout(loop, FRAME_INTERVAL) // 更可控
  }
  loop()
}

// 切换播放/暂停状态
function togglePlay() {
  const video = videoRef.value
  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause()
    // cancelAnimationFrame(animationFrameId)
    clearTimeout(animationIntervalId)
    togglePlay()
    disablePauseBtn.value = true
    disableResumeBtn.value = false
    showRed.value = false
    isPaused.value = true
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    disablePauseBtn.value = false
    disableResumeBtn.value = true
    showRed.value = true
    isPaused.value = false
    mediaRecorder.resume()
    // drawOverlay(performance.now())
    startDrawLoop()
    togglePlay()
  }
}

let loading
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    loading = ElLoading.service({
      lock: true,
      text: '正在保存视频, 请稍后!'
    })
    disableSettingBtn.value = false
    disableStopBtn.value = true
    disableResumeBtn.value = true
    disablePauseBtn.value = true
    showRed.value = false
    disableStartBtn.value = false
    isRecording.value = false
    mediaRecorder.stop()
    isPaused.value = false

    clearTimeout(animationIntervalId)
    animationIntervalId = null
    // cancelAnimationFrame(animationFrameId)

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

const upload = async () => {
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
  const {
    VITE_SEVER_URL: serverUrl,
    VITE_API_PREFIX: apiPrefix,
    VITE_SAVE_CHUNK_URL: saveChunkUrl,
    VITE_MERGE_CHUNK_URL: mergeChunkUrl,
    VITE_CHECK_FILE_URL: checkFileUrl
  } = import.meta.env
  const { success } = await window.electron.ipcRenderer.invoke('upload-file', {
    localFilePath: localFilePath.value,
    serverUrl,
    apiPrefix,
    saveChunkUrl,
    mergeChunkUrl,
    checkFileUrl
  })

  if (loading) loading.close()
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

const replay = async () => {
  videoRef.value.src = null // 清除之前的 src
  videoRef.value.srcObject = null // 确保清除任何现有的媒体流
  console.log('replay', localFilePath.value)
  showControls.value = true
  videoRef.value.src = `file:///${localFilePath.value}`
  videoRef.value.play()
}

const openSettingDialog = async () => {
  dialogSettingVisible.value = true
  await loadDevices()
}

const changeVideoInput = async (val) => {
  const videoinputDevice = videoinputDevices.value.find((e) => e.label === val)
  globalConfigStore.config.videoinputDeviceId = videoinputDevice.deviceId
  reloadDevice()
}

const changeAudioInput = (val) => {
  const audioinputDevice = audioinputDevices.value.find((e) => e.label === val)
  globalConfigStore.config.audioinputDeviceId = audioinputDevice.deviceId
  reloadDevice()
}

const reloadDevice = async () => {
  try {
    showControls.value = false
    const audio = globalConfigStore.config.audioinputDeviceId
      ? { deviceId: globalConfigStore.config.audioinputDeviceId }
      : true
    if (!mediaStream || isRecording.value) return
    // 停止旧的 mediaStream，避免摄像头资源被占用
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop())
    }
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio,
      video: { ...videoConfig.value, deviceId: globalConfigStore.config.videoinputDeviceId }
    })
    videoRef.value.src = null
    videoRef.value.srcObject = mediaStream
  } catch (error) {
    console.error('获取媒体设备失败:', error)
    ElMessage.error('当前设备不可用, 请检查设备是否正常!')
  }
}
</script>

<style lang="scss">
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
  font-size: 32px;
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
  font-size: 12px !important; /* 图标大小 */
}
</style>
