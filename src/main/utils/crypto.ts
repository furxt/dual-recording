import crypto from 'crypto'
import type { CipherKey, BinaryLike } from 'crypto'
export async function generateAndEncryptAesKey(
  publicKeyPem: string
): Promise<{ encryptedKey: string; key: Buffer; iv: Buffer }> {
  // 生成 AES-256 密钥 (32 bytes for 256 bits)
  const key = crypto.randomBytes(32) // 可以选择 16, 24, 或 32 字节

  // 生成 IV（Nonce）, 对于 GCM 建议使用 12 bytes (96 bits)
  const iv = crypto.randomBytes(12)

  const encryptedKeyBuf = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
    },
    key
  )

  return { encryptedKey: encryptedKeyBuf.toString('base64'), key, iv }
}

export function encryptData(data: Buffer, key: CipherKey, iv: BinaryLike): Buffer {
  // 创建 AES-GCM 加密器
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  // 更新加密内容
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

  // 获取认证标签（必须在 cipher.final() 之后调用！）
  const authTag = cipher.getAuthTag()
  return Buffer.concat([encrypted, authTag])
}

export default {
  encryptData,
  generateAndEncryptAesKey
}
