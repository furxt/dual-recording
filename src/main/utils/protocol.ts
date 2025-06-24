import { CUSTOM_PROTOCOL } from '@constants/index'
import { protocol } from 'electron'
import { createReadStream, existsSync } from 'fs'

export const registerVideoProtocol = (): void => {
  // 1. 注册私有协议 app://，并赋予它特权
  protocol.registerSchemesAsPrivileged([
    {
      scheme: CUSTOM_PROTOCOL,
      privileges: {
        secure: true, // 标记为安全协议（类似 HTTPS）
        standard: false, // 不是标准协议（像 http/https）
        supportFetchAPI: true, // 支持 fetch API
        corsEnabled: true, // 启用 CORS
        stream: true //启用对响应流的支持
      }
    }
  ])
}

export const registerVideoProtocolHandler = (): void => {
  // 2. 使用 protocol.handle() 注册自定义协议的处理逻辑
  protocol.handle(CUSTOM_PROTOCOL, async (request) => {
    console.log('request:', request)
    // 从请求的 URL 中提取文件路径
    const url = new URL(request.url)
    console.log('url:', url)

    if (url.hostname === 'video') {
      const pathname = url.pathname
      const filePath = decodeURIComponent(pathname.substring(1))

      // 检查文件是否存在
      if (!existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        return new Response(null, { status: 404 }) // 返回 404 错误
      }

      // 创建一个可读流（ReadableStream）来逐步读取文件
      const fileStream = createReadStream(filePath)

      // 将 Node.js 的 ReadStream 转换为浏览器兼容的 ReadableStream
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => {
            controller.enqueue(chunk) // 将文件流的数据块加入 ReadableStream
          })

          fileStream.on('end', () => {
            controller.close() // 文件读取完成，关闭流
          })

          fileStream.on('error', (err) => {
            console.error('File stream error:', err)
            controller.error(err) // 发生错误时终止流
          })
        }
      })

      // 返回 Response 对象，将 ReadableStream 作为 body
      return new Response(readableStream, {
        headers: { 'content-type': 'application/octet-stream' }
      })
    } else {
      console.log('unsupported hostname', url.hostname)
      return new Response('Not Found', { status: 404 })
    }
  })
}

export default {
  registerVideoProtocol,
  registerVideoProtocolHandler
}
