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
import type { IpcRendererEvent } from 'electron/renderer'
import type { LoadingInstance } from 'element-plus/es/components/loading/src/loading'
import { progressConstant } from './constants'
import { IpcMessageHandler, ipcRendererUtil } from './utils'
import { useGlobalConfigStore } from './stores'
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

const ipcMsgHandlerArr = [
  [CLOSE_WINDOW, closeAppWindow],
  [UPDATE_DOWNLOADED, updateDownloaded],
  [
    PRIMARY_MESSAGE,
    (_event: IpcRendererEvent, primaryMsg: string) => {
      ElMessage.primary(primaryMsg)
    }
  ],
  [
    UPDATE_AVAILABLE,
    (_event: IpcRendererEvent, appVersion: string) => {
      updateAvailable(appVersion)
    }
  ],
  [
    DOWNLOAD_PROGRESS,
    (_event: IpcRendererEvent, percentageVal: number) => {
      percentage.value = percentageVal
    }
  ],
  [
    CATCH_ERROR,
    (_event: IpcRendererEvent, errorMsg: string) => {
      ElMessage.error(errorMsg)
    }
  ]
] as Array<[string, IpcMsgHandler]>

const ipcMessageHandler = new IpcMessageHandler(APP_PAGE, new Map(ipcMsgHandlerArr))

const showCloseWindowMsgBox = ref(false)

let loading: LoadingInstance | null
const isDownloadUpdateApp = ref(false)
const percentage = ref(0)

onMounted(async () => {
  ipcRendererUtil.invoke<void>(CHECK_UPDATE)
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
