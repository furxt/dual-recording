export async function generateAndEncryptAesKey(
  publicKeyPem: string
): Promise<{ encryptedKey: string; iv: Uint8Array }> {
  // 1. 生成随机 AES-256-GCM 密钥和 IV
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // 2. 导出 AES 密钥为 ArrayBuffer
  const exportedKey = await crypto.subtle.exportKey('raw', key)
  const keyBuffer = exportedKey

  // 3. 将 PEM 格式的公钥转换为 CryptoKey
  const rsaPublicKey = await importRsaPublicKey(publicKeyPem)

  // 4. 用 RSA-OAEP 加密 AES 密钥
  const encryptedKeyBuffer = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPublicKey,
    keyBuffer
  )

  // 5. Base64 编码加密后的 AES 密钥（方便传输）
  const encryptedKeyBase64 = arrayBufferToBase64(encryptedKeyBuffer)

  return { encryptedKey: encryptedKeyBase64, iv: iv }
}

// 辅助函数：导入 PEM 格式的 RSA 公钥
async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  // 1. 移除 PEM 头尾和换行符
  const pemContents = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '')
  // 2. Base64 解码
  const binaryDer = base64ToArrayBuffer(pemContents)
  // 3. 导入为 CryptoKey
  return await crypto.subtle.importKey(
    'spki',
    binaryDer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}

// 辅助函数：Base64 转 ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// 辅助函数：ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}
