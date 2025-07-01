<template>
  <Suspense>
    <div class="bg-gray-100 h-[100vh] app">
      <div v-if="isDownloadUpdateApp" class="absolute-center">
        <el-progress type="dashboard" :percentage="percentage" :color="progressConstant.colors" />
      </div>
      <TitleBar v-model:show-close-window-msg-box="showCloseWindowMsgBox" />
      <Record />

      <!-- <div class="flex">
        <div class="w-[600px]">其他区域</div>
        <Record />
      </div> -->
    </div>
  </Suspense>
</template>

<script setup lang="ts">
import { progressConstant } from './constants'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'
import { IpcMessageHandler, ipcRendererUtil } from './utils'
import {
  DOWNLOAD_UPDATE,
  INSTALL_UPDATE,
  WINDOW_CLOSE,
  CHECK_UPDATE,
  PRIMARY_MESSAGE,
  APP_PAGE,
  UPDATE_AVAILABLE,
  DOWNLOAD_PROGRESS,
  CLOSE_WINDOW,
  UPDATE_DOWNLOADED,
  CATCH_ERROR
} from '@common/constants'
import { useGlobalConfigStore } from './stores'

const globalConfigStore = useGlobalConfigStore()

// 有新版本可以更新
const updateAvailable = (appVersion: string): void => {
  ElMessageBox.confirm(`检测到有新版本 ${appVersion} 可用，是否下载更新？`, '更新提示', {
    closeOnClickModal: false,
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'primary'
  })
    .then(() => {
      ipcRendererUtil.send(DOWNLOAD_UPDATE)
      loading = ElLoading.service({
        lock: true,
        background: 'rgba(250, 250, 250, 0.7)', // 白色半透明背景
        customClass: 'transparent-loading' // 自定义类名
      })
      isDownloadUpdateApp.value = true
    })
    .catch(() => {})
}

const closeAppWindow = (): void => {
  if (globalConfigStore.isRecording) {
    ElMessage.warning('请先停止录制')
  } else {
    if (!showCloseWindowMsgBox.value) {
      showCloseWindowMsgBox.value = true
      ElMessageBox.confirm('确认退出吗?', '警告', {
        closeOnClickModal: false,
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          ipcRendererUtil.send(WINDOW_CLOSE)
        })
        .catch(() => {})
        .finally(() => {
          showCloseWindowMsgBox.value = false
        })
    }
  }
}

const updateDownloaded = (): void => {
  setTimeout(() => {
    if (loading) {
      loading.close()
      loading = null
    }
    isDownloadUpdateApp.value = false
    ElMessageBox.confirm(`下载已完成，是否立即更新？`, '更新提示', {
      closeOnClickModal: false,
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    })
      .then(() => {
        ipcRendererUtil.send(INSTALL_UPDATE)
      })
      .catch(() => {})
  }, 500)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IpcMessageHandlerMap = new Map<string, (...data: any[]) => void | Promise<void>>([
  [
    PRIMARY_MESSAGE,
    (primaryMsg: string) => {
      console.log('node发送过来的常规消息', primaryMsg)
      ElMessage.primary(primaryMsg)
    }
  ],
  [
    UPDATE_AVAILABLE,
    (appVersion: string) => {
      console.log('检测到有新版本可以更新')
      updateAvailable(appVersion)
    }
  ],
  [
    DOWNLOAD_PROGRESS,
    (percentageVal: number) => {
      console.log('更新下载进度条', percentageVal)
      percentage.value = percentageVal
    }
  ],
  [
    CLOSE_WINDOW,
    () => {
      console.log('关闭窗口')
      closeAppWindow()
    }
  ],
  [
    UPDATE_DOWNLOADED,
    () => {
      console.log('更新下载完成')
      updateDownloaded()
    }
  ],
  [
    CATCH_ERROR,
    (errorMsg: string) => {
      console.log('收到node捕获的错误消息', errorMsg)
      ElMessage.error(errorMsg)
    }
  ]
])
const ipcMessageHandler = new IpcMessageHandler(APP_PAGE, IpcMessageHandlerMap)

const showCloseWindowMsgBox = ref(false)

let loading: LoadingInstance | null
const isDownloadUpdateApp = ref(false)
const percentage = ref(0)

onMounted(async () => {
  ipcRendererUtil.invoke(CHECK_UPDATE)
})

onUnmounted(() => {
  ipcMessageHandler.destroyed()
})
</script>

<style lang="scss">
.app {
  background:
    linear-gradient(to top left, #fff, #79bbff), linear-gradient(to bottom right, #fae9ed, #ffa5ba);
  background-blend-mode: multiply; /* 混合模式，让渐变叠加 */
}
</style>
